import { create } from 'zustand';
import { getBook } from '@/api'; // Assuming getBook is exported from @/api/index.ts
import { Book, BookTracking } from '@/types'; // Assuming Book, BookTracking are in @/types/index.ts

const CACHE_DURATION_MINUTES = 30;

interface BookDetailState {
  books: Record<string, Book>;
  isLoading: Record<string, boolean>;
  error: Record<string, string | null>;
  lastFetched: Record<string, Date | null>;

  fetchBook: (id: string, forceRefresh?: boolean) => Promise<void>;
  clearBookDetail: (id: string) => void;
  injectTrackedStatus: (bookId: string, trackingStatus: BookTracking | null) => void;

  // Optional selectors
  getBookById: (id: string) => Book | undefined;
  getLoadingState: (id: string) => boolean;
  getErrorState: (id: string) => string | null;
}

export const useBookDetailStore = create<BookDetailState>((set, get) => ({
  books: {},
  isLoading: {},
  error: {},
  lastFetched: {},

  fetchBook: async (id: string, forceRefresh = false) => {
    const { books, lastFetched, isLoading: currentIsLoading } = get();

    if (currentIsLoading[id]) {
      return; // Already fetching this book
    }

    if (!forceRefresh && books[id] && lastFetched[id]) {
      const now = new Date();
      const diffMinutes = (now.getTime() - (lastFetched[id] as Date).getTime()) / (1000 * 60);
      if (diffMinutes < CACHE_DURATION_MINUTES) {
        // console.log(`Using cached details for book ${id}.`);
        return;
      }
    }

    set((state) => ({
      isLoading: { ...state.isLoading, [id]: true },
      error: { ...state.error, [id]: null },
    }));

    try {
      const fetchedBook = await getBook({ id }); // API getBook expects { id: string }
      set((state) => ({
        books: { ...state.books, [id]: fetchedBook },
        lastFetched: { ...state.lastFetched, [id]: new Date() },
        isLoading: { ...state.isLoading, [id]: false },
      }));
    } catch (err) {
      console.error(`Failed to fetch book details for ${id}:`, err);
      set((state) => ({
        error: { ...state.error, [id]: (err as Error).message || `Failed to fetch book ${id}` },
        isLoading: { ...state.isLoading, [id]: false },
      }));
    }
  },

  clearBookDetail: (id: string) => {
    set((state) => {
      const newBooks = { ...state.books };
      const newIsLoading = { ...state.isLoading };
      const newError = { ...state.error };
      const newLastFetched = { ...state.lastFetched };

      delete newBooks[id];
      delete newIsLoading[id];
      delete newError[id];
      delete newLastFetched[id];

      return {
        books: newBooks,
        isLoading: newIsLoading,
        error: newError,
        lastFetched: newLastFetched,
      };
    });
  },

  injectTrackedStatus: (bookId: string, trackingStatus: BookTracking | null) => {
    set((state) => {
      const book = state.books[bookId];
      if (book) {
        return {
          books: {
            ...state.books,
            [bookId]: { ...book, tracking_status: trackingStatus, tracking: !!trackingStatus },
          },
        };
      }
      return {}; // No change if book not found
    });
  },

  // Selectors
  getBookById: (id: string) => get().books[id],
  getLoadingState: (id: string) => get().isLoading[id] || false,
  getErrorState: (id: string) => get().error[id] || null,
}));
