import { api } from './index';
import * as SecureStore from 'expo-secure-store';
import { RegisterResponse, LoginResponse, RefreshTokenResponse } from '@/types/auth';
import { User } from '../../types/user'; // Added User import

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

// Fetches the current user's profile information
export const getMe = async (): Promise<User | null> => {
  // No token is explicitly passed as an argument here
  // because the token should be automatically included in the
  // api instance's headers by an interceptor (as configured in api/index.ts typically)
  try {
    const response = await api.get<User>('/auth/me'); // Corrected endpoint and added type
    return response.data;
  } catch (error) {
    // If the /auth/me endpoint returns 401 or other errors,
    // it indicates an issue with the token or user session.
    // console.error('Failed to fetch user data:', error);
    // It's often better to let the caller handle the error,
    // especially if it's an auth error that should trigger logout.
    // For now, returning null as per previous placeholder logic.
    // In a real app, this error handling might be more sophisticated.
    return null;
  }
};