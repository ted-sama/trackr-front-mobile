import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

const TOKEN_KEY = 'user_auth_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';

export const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize API with stored token
export const initializeAPI = async () => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to initialize API with stored token:', error);
  }
};

// Flag to prevent multiple refresh attempts simultaneously
let isRefreshing = false;
// Queue for requests that failed due to token expiry
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (error: AxiosError) => void;
}[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Attempt to refresh the access token using the stored refresh token
 */
const refreshAccessToken = async (): Promise<{
  token: string;
  refreshToken: string;
} | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      console.log('[Auth] No refresh token found in storage - user needs to re-login');
      return null;
    }

    console.log('[Auth] Attempting to refresh access token...');
    console.log('[Auth] Refresh token length:', refreshToken.length);

    // Make refresh request without the Authorization header
    const response = await axios.post(`${apiUrl}/auth/refresh`, {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;

    if (!token || !newRefreshToken) {
      console.error('[Auth] Refresh response missing tokens:', { hasToken: !!token, hasRefresh: !!newRefreshToken });
      return null;
    }

    console.log('[Auth] Received new tokens from server');

    // CRITICAL: Store tokens in correct order with verification
    // Store new access token first
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('[Auth] New access token stored');
    } catch (storeError) {
      console.error('[Auth] Failed to store new access token:', storeError);
      // Don't continue if we can't store the access token
      return null;
    }

    // Store new refresh token (critical for next refresh cycle)
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
      console.log('[Auth] New refresh token stored');
      
      // Verify the refresh token was stored correctly
      const verifyRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (verifyRefresh !== newRefreshToken) {
        console.error('[Auth] CRITICAL: Refresh token storage verification failed!');
        console.error('[Auth] Expected length:', newRefreshToken.length, 'Got length:', verifyRefresh?.length);
      } else {
        console.log('[Auth] Refresh token storage verified');
      }
    } catch (storeError) {
      console.error('[Auth] Failed to store new refresh token:', storeError);
      // Continue anyway - we have the access token, just won't be able to refresh again
    }

    // Update API header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('[Auth] Token refresh completed successfully');
    return { token, refreshToken: newRefreshToken };
  } catch (error: any) {
    // Refresh failed
    const status = error?.response?.status;
    const data = error?.response?.data;
    
    console.error('[Auth] Token refresh failed:');
    console.error('[Auth] - Status:', status);
    console.error('[Auth] - Error code:', data?.code);
    console.error('[Auth] - Message:', data?.message || error?.message);
    
    // Only clear tokens if it's a definitive auth failure (401)
    // For network errors or server errors, we might want to retry later
    if (status === 401) {
      console.log('[Auth] Clearing tokens due to 401 response');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      delete api.defaults.headers.common['Authorization'];
    } else {
      console.log('[Auth] Keeping tokens - error may be temporary (status:', status, ')');
    }
    
    return null;
  }
};

/**
 * Setup the 401 interceptor that attempts to refresh the token before logging out.
 * Returns the interceptor ID so it can be ejected if needed.
 */
export const setupAuthInterceptor = (onUnauthorized: () => void): number => {
  return api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Only handle 401 errors
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // Don't retry refresh endpoint to avoid infinite loop
      if (originalRequest.url?.includes('/auth/refresh')) {
        onUnauthorized();
        return Promise.reject(error);
      }

      // Don't retry if already retried
      if (originalRequest._retry) {
        onUnauthorized();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark as retrying and start refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await refreshAccessToken();

        if (tokens) {
          // Refresh successful, process queue and retry original request
          processQueue(null, tokens.token);

          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${tokens.token}`;
          }

          return api(originalRequest);
        } else {
          // Refresh failed
          processQueue(error, null);
          onUnauthorized();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(error, null);
        onUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};
