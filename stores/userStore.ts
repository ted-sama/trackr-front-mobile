import { create } from 'zustand';
import { getMe, updateUserProfile } from '@/services/api';
import { User } from '@/types';

export interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  fetchCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMe();
      set({
        currentUser: response.user,
        isAuthenticated: true,
      });
    } catch (e: any) {
      set({ 
        error: e.message,
        currentUser: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (userData: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await updateUserProfile(userData);
      set({
        currentUser: updatedUser,
      });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: User | null) => {
    set({
      currentUser: user,
      isAuthenticated: user !== null,
      error: null,
    });
  },

  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
      error: null,
    });
  },
})); 