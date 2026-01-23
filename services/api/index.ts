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
      return null;
    }

    // Make refresh request without the Authorization header
    const response = await axios.post(`${apiUrl}/auth/refresh`, {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;

    // Store new tokens
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

    // Update API header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return { token, refreshToken: newRefreshToken };
  } catch (error) {
    // Refresh failed, clear tokens
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
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
