import { api } from './index';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { RegisterResponse, LoginResponse, RefreshTokenResponse } from '@/types/auth';

const REFRESH_TOKEN_KEY = 'user_refresh_token';
const TOKEN_KEY = 'user_auth_token';

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
    const response = await axios.post('http://127.0.0.1:3333/api/v1/auth/refresh', 
      { refreshToken: storedRefreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    if (accessToken) {
      await setAuthTokens(accessToken, newRefreshToken);
    }
    
    return response.data;
  } catch (error) {
    // If refresh fails, clear tokens to force logout
    await clearAuthTokens();
    throw error;
  }
};