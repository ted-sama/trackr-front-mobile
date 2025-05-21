import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user'; // Assuming User is defined here
import { login as loginApi } from '../api/auth'; // Import the login API function
import { useTrackingStore } from './trackingStore';
import { useListStore } from './listStore';

const USER_AUTH_TOKEN = 'USER_AUTH_TOKEN';
const USER_REFRESH_TOKEN = 'USER_REFRESH_TOKEN';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null; // TODO: Define User type more concretely if needed
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>; // Modified signature
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setError: (error: string | null) => void;
  getIsAuthenticated: () => boolean;
  // TODO: Add action for fetching user data: fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginApi({ email, password });
      if (response.access_token && response.refresh_token) {
        await SecureStore.setItemAsync(USER_AUTH_TOKEN, response.access_token);
        await SecureStore.setItemAsync(USER_REFRESH_TOKEN, response.refresh_token);
        // TODO: Fetch user data using the new token and set the user state
        // For now, setting a placeholder user or null
        // await get().fetchUser(); // Example if fetchUser action exists

        set({
          token: response.access_token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
          isLoading: false,
          user: null, // Replace with actual user data after fetching
        });

        // Fetch related data after successful login
        // These are fire-and-forget for the login promise itself,
        // their own loading/error states are handled in their respective stores.
        useTrackingStore.getState().fetchTrackedBooks();
        useListStore.getState().fetchUserLists();
        // No need to await these for the login to be "complete" from auth perspective
        
      } else {
        const errorMessage = response.message || 'Login failed: No tokens received';
        set({ error: errorMessage, isLoading: false, isAuthenticated: false, token: null, refreshToken: null, user: null });
        throw new Error(errorMessage); // Throw error to be caught by calling component if needed
      }
    } catch (error: any) {
      console.error('Login API error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during login.';
      set({ error: errorMessage, isLoading: false, isAuthenticated: false, token: null, refreshToken: null, user: null });
      throw new Error(errorMessage); // Re-throw error
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await SecureStore.deleteItemAsync(USER_AUTH_TOKEN);
      await SecureStore.deleteItemAsync(USER_REFRESH_TOKEN);
      useTrackingStore.getState().clearTrackedBooks(); // Updated store name
      useListStore.getState().clearLists(); // Clear lists on logout
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ error: 'Failed to logout', isLoading: false });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await SecureStore.getItemAsync(USER_AUTH_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(USER_REFRESH_TOKEN);
      if (token && refreshToken) {
        // TODO: Fetch user data
        set({ token, refreshToken, isAuthenticated: true, isLoading: false, user: null /* TODO: set actual user */ });
        // Fetch related data on auth initialization
        await useTrackingStore.getState().fetchTrackedBooks();
        await useListStore.getState().fetchUserLists();
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ error: 'Failed to initialize auth', isLoading: false });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  getIsAuthenticated: () => {
    return get().token !== null;
  },
}));
