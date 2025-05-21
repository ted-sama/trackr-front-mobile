import { create } from 'zustand';
import { ReadingList } from '../types';
import { getMyLists } from '../api';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ListState {
  lists: ReadingList[];
  isLoading: boolean;
  error: string | null;
  cache: { data: ReadingList[]; timestamp: number } | null;
  fetchUserLists: (forceRefresh?: boolean) => Promise<void>;
  clearLists: () => void;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,
  cache: null,

  fetchUserLists: async (forceRefresh = false) => {
    set({ isLoading: true, error: null });
    const now = Date.now();
    const cache = get().cache;

    if (!forceRefresh && cache && (now - cache.timestamp < CACHE_DURATION)) {
      set({ lists: cache.data, isLoading: false });
      return;
    }

    try {
      // Assuming getMyLists returns ReadingList[] directly
      // If it returns an object like { items: ReadingList[] }, adjust accordingly.
      const data = await getMyLists(); 
      set({ lists: data, cache: { data, timestamp: now }, isLoading: false });
    } catch (error) {
      console.error('Error fetching user lists:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user lists';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearLists: () => {
    set({ lists: [], error: null, cache: null, isLoading: false });
  },
}));
