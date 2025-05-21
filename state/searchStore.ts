import { create } from 'zustand';
import { search as apiSearch } from '@/api'; // Renamed to avoid conflict
import { Book } from '@/types';

const DEFAULT_LIMIT = 20;

interface SearchState {
  results: Book[];
  query: string;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  offset: number;
  limit: number;
  hasMore: boolean;
  lastQuery: string | null;

  setQuery: (newQuery: string) => void;
  performSearch: (append?: boolean) => Promise<void>;
  fetchMore: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  query: '',
  isLoading: false,
  isFetchingMore: false,
  error: null,
  offset: 0,
  limit: DEFAULT_LIMIT,
  hasMore: true,
  lastQuery: null,

  setQuery: (newQuery: string) => {
    const { query: currentQuery, lastQuery, results: currentResults, clearSearch, performSearch } = get();
    set({ query: newQuery });

    if (newQuery === '') {
      clearSearch();
      return;
    }

    // Perform search if query changed significantly or if it's a new query with no results yet
    if (newQuery !== currentQuery || newQuery !== lastQuery || currentResults.length === 0) {
      set({ results: [], offset: 0, hasMore: true }); // Reset for a new search context
      performSearch(false); // Explicitly a new search, not appending
    }
  },

  performSearch: async (append = false) => {
    const { query, offset, limit, isLoading, isFetchingMore, results: currentResults } = get();

    if (query === '') {
      // console.log('Search query is empty, aborting.');
      return;
    }
    if (isLoading || (append && isFetchingMore)) {
      // console.log('Search already in progress, aborting.');
      return;
    }

    if (!append) {
      set({ isLoading: true, error: null, offset: 0 }); // Reset offset for new search
    } else {
      set({ isFetchingMore: true, error: null });
    }

    try {
      const fetchedBooks = await apiSearch({ query, offset: append ? offset : 0, limit });
      
      set((state) => ({
        results: append ? [...currentResults, ...fetchedBooks] : fetchedBooks,
        offset: (append ? offset : 0) + fetchedBooks.length,
        hasMore: fetchedBooks.length === limit,
        lastQuery: query, // Update lastQuery on successful search
      }));
    } catch (err) {
      console.error('Failed to perform search:', err);
      set({ error: (err as Error).message || 'Failed to perform search' });
    } finally {
      if (!append) {
        set({ isLoading: false });
      } else {
        set({ isFetchingMore: false });
      }
    }
  },

  fetchMore: () => {
    const { hasMore, isLoading, isFetchingMore, performSearch } = get();
    if (hasMore && !isLoading && !isFetchingMore) {
      performSearch(true);
    }
  },

  clearSearch: () => {
    set({
      results: [],
      query: '',
      isLoading: false,
      isFetchingMore: false,
      error: null,
      offset: 0,
      hasMore: true,
      lastQuery: null,
    });
  },
}));
