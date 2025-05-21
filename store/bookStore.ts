import { create } from 'zustand';
import { Book, Category } from '../types'; // Assuming Book and Category are in types/index.ts
import { getCategories, getBook, getCategory } from '../api'; // Assuming API functions

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface BookState {
  categories: Category[];
  currentBook: Book | null;
  recommendations: Book[]; // Initially assuming recommendations are a list of books
  isLoadingCategories: boolean;
  isLoadingBookDetail: boolean;
  isLoadingRecommendations: boolean;
  errorCategories: string | null;
  errorBookDetail: string | null;
  errorRecommendations: string | null;
  categoriesCache: { data: Category[]; timestamp: number } | null;
  bookDetailCache: Record<string, { data: Book; timestamp: number }>;

  fetchCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchBookDetail: (bookId: string, forceRefresh?: boolean) => Promise<void>;
  fetchRecommendations: (bookId: string) => Promise<void>; // forceRefresh can be added if needed
  clearCurrentBook: () => void;
  clearRecommendations: () => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  categories: [],
  currentBook: null,
  recommendations: [],
  isLoadingCategories: false,
  isLoadingBookDetail: false,
  isLoadingRecommendations: false,
  errorCategories: null,
  errorBookDetail: null,
  errorRecommendations: null,
  categoriesCache: null,
  bookDetailCache: {},

  fetchCategories: async (forceRefresh = false) => {
    set({ isLoadingCategories: true, errorCategories: null });
    const now = Date.now();
    const cache = get().categoriesCache;

    if (!forceRefresh && cache && (now - cache.timestamp < CACHE_DURATION)) {
      set({ categories: cache.data, isLoadingCategories: false });
      return;
    }

    try {
      const data = await getCategories();
      set({ categories: data, categoriesCache: { data, timestamp: now }, isLoadingCategories: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ errorCategories: 'Failed to fetch categories', isLoadingCategories: false });
    }
  },

  fetchBookDetail: async (bookId: string, forceRefresh = false) => {
    set({ isLoadingBookDetail: true, errorBookDetail: null });
    const now = Date.now();
    const cache = get().bookDetailCache[bookId];

    if (!forceRefresh && cache && (now - cache.timestamp < CACHE_DURATION)) {
      set({ currentBook: cache.data, isLoadingBookDetail: false });
      return;
    }

    try {
      const data = await getBook({ id: bookId });
      set(state => ({
        currentBook: data,
        bookDetailCache: { ...state.bookDetailCache, [bookId]: { data, timestamp: now } },
        isLoadingBookDetail: false,
      }));
    } catch (error) {
      console.error(`Error fetching book detail for ${bookId}:`, error);
      set({ errorBookDetail: `Failed to fetch book details for ${bookId}`, isLoadingBookDetail: false });
    }
  },

  fetchRecommendations: async (bookId: string) => {
    // As per app/book/[id].tsx, recommendations are fetched as a Category object.
    // So, we will fetch Category '1' (dummy id) and extract books from it.
    // The state will store Book[] for recommendations.
    set({ isLoadingRecommendations: true, errorRecommendations: null });
    try {
      // Assuming getCategory('1') is the way to get recommendations for any book for now
      // This might need to be adjusted if the API provides a more direct way or uses the bookId
      const categoryData = await getCategory('1'); 
      if (categoryData && categoryData.books) {
        set({ recommendations: categoryData.books, isLoadingRecommendations: false });
      } else {
        set({ recommendations: [], isLoadingRecommendations: false, errorRecommendations: 'No recommendations found or category has no books' });
      }
    } catch (error) {
      console.error(`Error fetching recommendations for book ${bookId}:`, error);
      set({ errorRecommendations: 'Failed to fetch recommendations', isLoadingRecommendations: false });
    }
  },

  clearCurrentBook: () => {
    set({ currentBook: null });
  },

  clearRecommendations: () => {
    set({ recommendations: [] });
  },
}));
