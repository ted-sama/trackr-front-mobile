import { api } from './index';
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
  return response.data;
};

export const refreshToken = async (): Promise<RefreshTokenResponse> => {
  const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!storedRefreshToken) {
    throw new Error('No refresh token found');
  }
  try {
    const response = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
    const { access_token } = response.data;
    if (access_token) {
      await SecureStore.setItemAsync(TOKEN_KEY, access_token);
      // Optionally, if the backend sends a new refresh token, store it as well
      // if (response.data.refresh_token) {
      //   await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refresh_token);
      // }
    }
    return response.data;
  } catch (error) {
    // If refresh fails, clear tokens to force logout
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    throw error; // Re-throw error to be caught by the interceptor
  }
};