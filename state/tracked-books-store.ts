import { create } from 'zustand';
import { Book, BookTracking, ReadingStatus } from '@/types'; // Added ReadingStatus
import {
  getMyLibraryBooks,
  addBookToTracking,
  removeBookFromTracking,
  updateBookTracking as apiUpdateBookTracking,
  checkIfBookIsTracked,
  getBook,
} from '@/api'; // Added API imports

// Define updateBookTrackingParams here as it's not exported from @/api
export interface UpdateBookTrackingParams {
  bookId: string; // API uses string
  status?: ReadingStatus;
  current_chapter?: number;
  current_volume?: number;
  rating?: number;
  start_date?: Date;
  finish_date?: Date;
  notes?: string;
  last_read_at?: Date;
}

const CACHE_DURATION_MINUTES = 5;

interface TrackedBooksState {
  trackedBooks: Record<number, Book>; // Book ID (number) is the key
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;

  fetchMyLibrary: (force?: boolean) => Promise<void>;
  trackBook: (bookId: string) => Promise<void>;
  untrackBook: (bookId: string) => Promise<void>;
  updateTrackingDetails: (params: UpdateBookTrackingParams) => Promise<void>;
  checkAndSyncBookTracking: (bookId: string) => Promise<void>;

  // Internal state modifiers (modified from original actions)
  addTrackedBookInternal: (book: Book) => void;
  removeTrackedBookInternal: (bookId: number) => void;

  // Existing query-like actions (can remain as is)
  isBookTracked: (bookId: number) => boolean;
  getTrackedBooks: () => Book[];
  getTrackedBookStatus: (bookId: number) => BookTracking | null;
  clearTrackedBooks: () => void;
}

export const useTrackedBooksStore = create<TrackedBooksState>((set, get) => ({
  trackedBooks: {},
  isLoading: false,
  error: null,
  lastFetched: null,

  addTrackedBookInternal: (book) => set((state) => ({ // Renamed and kept logic
    trackedBooks: { ...state.trackedBooks, [book.id]: { ...book, updated_at: new Date() } },
  })),
  removeTrackedBookInternal: (id) => set((state) => { // Renamed and kept logic
    const newTrackedBooks = { ...state.trackedBooks };
    delete newTrackedBooks[id];
    return { trackedBooks: newTrackedBooks };
  }),
  // updateTrackedBook removed
  isBookTracked: (id) => Boolean(get().trackedBooks[id]),
  getTrackedBooks: () => Object.values(get().trackedBooks),
  getTrackedBookStatus: (id) => get().trackedBooks[id]?.tracking_status || null,
  clearTrackedBooks: () => set({ 
    trackedBooks: {}, 
    lastFetched: null, 
    error: null, 
    isLoading: false 
  }),

  fetchMyLibrary: async (force = false) => {
    const { lastFetched, trackedBooks: currentTrackedBooks } = get(); // Renamed to avoid conflict in scope
    if (!force && lastFetched && Object.keys(currentTrackedBooks).length > 0) {
      const now = new Date();
      const diffMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);
      if (diffMinutes < CACHE_DURATION_MINUTES) {
        // console.log('Using cached library');
        return; // Use cached data
      }
    }

    set({ isLoading: true, error: null });
    try {
      // API returns BookResponse { items: Book[] }
      const response = await getMyLibraryBooks({ offset: 0, limit: 1000 }); 
      const newTrackedBooksRecord: Record<number, Book> = {};
      response.items.forEach((book) => {
        // The book from getMyLibraryBooks is the source of truth.
        // It should already contain its tracking_status if tracked.
        newTrackedBooksRecord[book.id] = { ...book, tracking: true, updated_at: new Date() };
      });
      set({
        trackedBooks: newTrackedBooksRecord,
        lastFetched: new Date(),
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch my library:', err);
      set({ error: (err as Error).message || 'Failed to fetch library', isLoading: false });
    }
  },
  
  trackBook: async (bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      const trackingInfo = await addBookToTracking(bookId); // API returns BookTracking
      const bookDetails = await getBook({ id: bookId });   // API returns Book

      const bookToAdd: Book = {
        ...bookDetails, // Full book details
        tracking: true, // Explicitly set tracking to true
        tracking_status: trackingInfo, // Add the tracking status from addBookToTracking response
        updated_at: new Date(),
      };
      get().addTrackedBookInternal(bookToAdd);
      set({ isLoading: false });
    } catch (err) {
      console.error(`Failed to track book ${bookId}:`, err);
      set({ error: (err as Error).message || `Failed to track book ${bookId}`, isLoading: false });
    }
  },

  untrackBook: async (bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      await removeBookFromTracking(bookId);
      get().removeTrackedBookInternal(parseInt(bookId, 10)); // bookId is string, key is number
      set({ isLoading: false });
    } catch (err) {
      console.error(`Failed to untrack book ${bookId}:`, err);
      set({ error: (err as Error).message || `Failed to untrack book ${bookId}`, isLoading: false });
    }
  },

  updateTrackingDetails: async (params: UpdateBookTrackingParams) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTrackingStatus = await apiUpdateBookTracking(params); // API returns BookTracking
      const bookIdNum = parseInt(params.bookId, 10);
      const currentBook = get().trackedBooks[bookIdNum];

      if (currentBook) {
        const updatedBook: Book = {
          ...currentBook,
          tracking_status: updatedTrackingStatus, // Update the tracking_status field
          updated_at: new Date(),
        };
        get().addTrackedBookInternal(updatedBook); // This will update the book in the store
      } else {
        // If book is not in store, one might fetch it first or log a warning.
        console.warn(`Book ${params.bookId} not found in local store to update tracking details. Consider fetching it first or using checkAndSyncBookTracking.`);
      }
      set({ isLoading: false });
    } catch (err) {
      console.error(`Failed to update tracking for book ${params.bookId}:`, err);
      set({ error: (err as Error).message || 'Failed to update tracking details', isLoading: false });
    }
  },

  checkAndSyncBookTracking: async (bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      const apiTrackingStatus = await checkIfBookIsTracked(bookId); // API returns BookTracking or specific error for not tracked
      const bookIdNum = parseInt(bookId, 10);
      const localBook = get().trackedBooks[bookIdNum];

      if (apiTrackingStatus) { // Book is tracked according to the API
        // If not in local store, or if its status differs, fetch full book details and update/add.
        // A simple JSON.stringify might be too naive for complex objects, but good for basic check.
        if (!localBook || JSON.stringify(localBook.tracking_status) !== JSON.stringify(apiTrackingStatus)) {
          const bookDetails = await getBook({ id: bookId }); // Fetch full book details
          const bookToSync: Book = {
            ...bookDetails,
            tracking: true,
            tracking_status: apiTrackingStatus, // Use fresh tracking status from API
            updated_at: new Date(),
          };
          get().addTrackedBookInternal(bookToSync);
        }
      } else { 
        // This 'else' block might not be reached if API throws error for "not tracked"
        // Depending on API, a null response from checkIfBookIsTracked might mean "not tracked"
        if (localBook) {
          // If it exists locally but API says it's not tracked, remove it from local store
          get().removeTrackedBookInternal(bookIdNum);
        }
      }
      set({ isLoading: false });
    } catch (err: any) {
      // console.error(`Failed to sync tracking for book ${bookId}:`, err);
      const bookIdNum = parseInt(bookId, 10);
      // If API returns a 404 (or similar indicating "not found" or "not tracked"), and book is local, remove it
      // This depends on the actual error structure from the API client (axios)
      if (err.isAxiosError && err.response && err.response.status === 404) {
        if (get().trackedBooks[bookIdNum]) {
          console.log(`Book ${bookId} not found via API (404), removing from local store.`);
          get().removeTrackedBookInternal(bookIdNum);
        }
        set({ error: null, isLoading: false }); // Not necessarily an error state for the store if 404 means "not tracked"
      } else {
        set({ error: (err as Error).message || `Failed to sync book ${bookId}`, isLoading: false });
      }
    }
  },
}));