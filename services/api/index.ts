import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api: AxiosInstance = axios.create({
  // baseURL: 'https://api.trackrr.app',
  baseURL: 'https://4ba4dc90505f.ngrok-free.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize API with stored token
export const initializeAPI = async () => {
  try {
    const token = await SecureStore.getItemAsync('user_auth_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to initialize API with stored token:', error);
  }
};

// Variable to prevent multiple refresh attempts simultaneously
let isRefreshing = false;
// Queue for requests that failed due to token expiry
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/*
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        // If token is already being refreshed, queue the original request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(async token => {
          if (originalRequest.headers && token) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      // Mark this request as retried to prevent infinite loops
      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshToken();
        if (refreshResponse.accessToken) {
          const newAccessToken = refreshResponse.accessToken;
          
          // Update the current request's authorization header
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          }
          
          // Process the queue with the new token
          processQueue(null, newAccessToken);
          
          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh response does not contain access_token, treat as failure
          await clearAuthTokens();
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Clear tokens and process queue with error
        await clearAuthTokens();
        processQueue(refreshError as AxiosError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
*/
