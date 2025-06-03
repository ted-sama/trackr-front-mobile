import { api } from './index';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { RegisterResponse, LoginResponse, RefreshTokenResponse } from '@/types/auth';

const REFRESH_TOKEN_KEY = 'user_refresh_token';
const TOKEN_KEY = 'user_auth_token';

interface RegisterParams {
    username: string;
    email: string;
    password: string;
}

interface LoginParams {
    email: string;
    password: string;
}

export const register = async ({ username, email, password }: RegisterParams): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async ({ email, password }: LoginParams): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  
  // Store tokens and update API headers
  if (response.data.access_token) {
    await setAuthTokens(response.data.access_token, response.data.refresh_token);
  }
  
  return response.data;
};

// Utility function to set auth tokens and update API headers
export const setAuthTokens = async (accessToken: string, refreshToken?: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  // Update API default headers
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
};

// Utility function to clear auth tokens and update API headers
export const clearAuthTokens = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  
  // Clear API default headers
  delete api.defaults.headers.common['Authorization'];
};

export const logout = async () => {
  await clearAuthTokens();
};

export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!storedRefreshToken) {
    throw new Error('No refresh token found');
  }
  
  try {
    // Use axios directly instead of api instance to avoid interceptor interference
    const response = await axios.post('https://0gkclppoo967.share.zrok.io/api/v1/auth/refresh', 
      { refreshToken: storedRefreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const { access_token, refresh_token } = response.data;
    
    if (access_token) {
      await setAuthTokens(access_token, refresh_token);
    }
    
    return response.data;
  } catch (error) {
    // If refresh fails, clear tokens to force logout
    await clearAuthTokens();
    throw error;
  }
};