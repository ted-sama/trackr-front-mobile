import { api } from './index';
import * as SecureStore from 'expo-secure-store';
import { RegisterResponse, LoginResponse } from '@/types/auth';

const TOKEN_KEY = 'user_auth_token';

// Utility function to set auth tokens and update API headers
export const setAuthToken = async (accessToken: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  
  // Update API default headers
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
};

// Utility function to clear auth tokens and update API headers
export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  
  // Clear API default headers
  delete api.defaults.headers.common['Authorization'];
};

export const logout = async () => {
  await clearAuthToken();
};