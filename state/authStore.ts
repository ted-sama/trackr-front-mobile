import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user';
import { useTrackedBooksStore } from './tracked-books-store';
import { getMe } from '../api'; // Import the actual getMe function

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  checkAuthStatus: () => Promise<void>;
  login: (newToken: string, newRefreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check auth status initially
  user: null,

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const authToken = await SecureStore.getItemAsync('user_auth_token');
      // const refreshToken = await SecureStore.getItemAsync('user_refresh_token'); // Also load refresh token if needed elsewhere

      if (authToken) {
        set({ token: authToken, isAuthenticated: true });
        const userData = await getMe();
        if (userData) {
          set({ user: userData });
        } else {
          // If getMe fails, treat as unauthenticated
          set({ token: null, isAuthenticated: false, user: null });
          await SecureStore.deleteItemAsync('user_auth_token');
          await SecureStore.deleteItemAsync('user_refresh_token');
        }
      } else {
        set({ token: null, isAuthenticated: false, user: null });
      }
    } catch (error) {
      console.error('Error during checkAuthStatus:', error);
      set({ token: null, isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (newToken: string, newRefreshToken: string) => {
    set({ isLoading: true });
    try {
      await SecureStore.setItemAsync('user_auth_token', newToken);
      await SecureStore.setItemAsync('user_refresh_token', newRefreshToken);
      set({ token: newToken, isAuthenticated: true });

      const userData = await getMe();
      if (userData) {
        set({ user: userData });
      } else {
        // If getMe fails, revert login state
        set({ token: null, isAuthenticated: false, user: null });
        await SecureStore.deleteItemAsync('user_auth_token');
        await SecureStore.deleteItemAsync('user_refresh_token');
        // Potentially throw an error or return a status to the caller
        console.error('Login failed: Could not fetch user data.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      // Ensure state is reset on error
      set({ token: null, isAuthenticated: false, user: null });
      await SecureStore.deleteItemAsync('user_auth_token');
      await SecureStore.deleteItemAsync('user_refresh_token');
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await SecureStore.deleteItemAsync('user_auth_token');
      await SecureStore.deleteItemAsync('user_refresh_token');
      set({ token: null, isAuthenticated: false, user: null });
      useTrackedBooksStore.getState().clearTrackedBooks();
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if error occurs, try to set state to logged out
      set({ token: null, isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Initialize auth status when the store is created/loaded
// This is important for apps that need to know auth state on startup
// useAuthStore.getState().checkAuthStatus();
// However, calling it here might lead to issues with store initialization order or async operations.
// It's generally better to call this from a top-level component (e.g., _layout.tsx or App.tsx)
// once the app is ready.

// To ensure isLoading is true initially as per requirements,
// we set it in the initial state and checkAuthStatus can be called from app root.
// If checkAuthStatus is not called, isLoading will remain true.
// For the purpose of this subtask, setting isLoading: true in initial state is sufficient.
