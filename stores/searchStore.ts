import { create } from 'zustand';
import { api } from '@/services/api';
import { Book } from '@/types/book';
import { List } from '@/types/list';
import { PaginatedResponse } from '@/types/api';

type SearchFilter = 'books' | 'lists';

interface SearchState {
  // État de la recherche
  searchQuery: string;
  activeFilter: SearchFilter;
  bookResults: Book[];
  listResults: List[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalResults: number;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: SearchFilter) => void;
  search: (query: string, page?: number) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  setInitialFilterFromTab: (tabType: SearchFilter) => void;
  
  // Getters
  getCurrentResults: () => (Book | List)[];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // État initial
  searchQuery: '',
  activeFilter: 'books',
  bookResults: [],
  listResults: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  totalResults: 0,

  // Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setActiveFilter: (filter: SearchFilter) => {
    set({ activeFilter: filter });
  },

  search: async (query: string, page = 1) => {
    const { activeFilter } = get();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      get().clearSearch();
      return;
    }

    // Si c'est une nouvelle recherche (page 1), on remet à zéro
    if (page === 1) {
      set({ 
        isLoading: true, 
        error: null, 
        currentPage: 1,
        hasMore: true,
        totalResults: 0
      });
      
      // Reset les résultats appropriés
      if (activeFilter === 'books') {
        set({ bookResults: [] });
      } else {
        set({ listResults: [] });
      }
    } else {
      // Si c'est pour charger plus de résultats
      set({ isLoadingMore: true, error: null });
    }

    try {
      const endpoint = activeFilter === 'books' ? '/books/search' : '/lists/search';
      const response = await api.get<PaginatedResponse<Book | List>>(endpoint, {
        params: {
          q: trimmedQuery,
          page: page,
          limit: 20
        }
      });

      const { data: results, meta } = response.data;
      
      console.log(`Search ${activeFilter} response:`, { count: results.length, meta, page });

      set((state) => {
        if (activeFilter === 'books') {
          return {
            bookResults: page === 1 ? results as Book[] : [...state.bookResults, ...results as Book[]],
            currentPage: meta.currentPage,
            totalResults: meta.total,
            hasMore: meta.currentPage < meta.lastPage,
            isLoading: false,
            isLoadingMore: false,
            error: null
          };
        } else {
          return {
            listResults: page === 1 ? results as List[] : [...state.listResults, ...results as List[]],
            currentPage: meta.currentPage,
            totalResults: meta.total,
            hasMore: meta.currentPage < meta.lastPage,
            isLoading: false,
            isLoadingMore: false,
            error: null
          };
        }
      });

    } catch (e: any) {
      set({ 
        error: e.response?.data?.message || e.message || 'Erreur lors de la recherche',
        isLoading: false,
        isLoadingMore: false,
        hasMore: false
      });
    }
  },

  loadMoreResults: async () => {
    const { searchQuery, currentPage, hasMore, isLoading, isLoadingMore } = get();
    
    console.log('loadMoreResults called:', { searchQuery, currentPage, hasMore, isLoading, isLoadingMore });
    
    if (!hasMore || isLoading || isLoadingMore || !searchQuery.trim()) {
      console.log('loadMoreResults: conditions not met, returning');
      return;
    }

    console.log('loadMoreResults: loading page', currentPage + 1);
    await get().search(searchQuery, currentPage + 1);
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      bookResults: [],
      listResults: [],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasMore: true,
      currentPage: 1,
      totalResults: 0
    });
  },

  clearError: () => {
    set({ error: null });
  },

  getCurrentResults: () => {
    const { activeFilter, bookResults, listResults } = get();
    return activeFilter === 'books' ? bookResults : listResults;
  },

  setInitialFilterFromTab: (tabType: SearchFilter) => {
    set({ activeFilter: tabType });
  }
}));