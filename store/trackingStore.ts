import { create } from 'zustand';
import { Book, BookTracking, BookResponse } from '../types'; // Adjusted path
import { addBookToTracking, removeBookFromTracking, updateBookTracking, getMyLibraryBooks } from '../api'; // Adjusted path

interface TrackingState {
  trackedBooks: Record<number, Book>;
  isLoading: boolean;
  isUpdating: Record<number, boolean>;
  error: string | null;
  updateError: Record<number, string | null>;

  fetchTrackedBooks: () => Promise<void>;
  addTrackedBook: (book: Book) => Promise<void>;
  removeTrackedBook: (bookId: number) => Promise<void>;
  updateTrackedBook: (bookId: number, data: Partial<BookTracking> & { book?: Partial<Book> }) => Promise<void>;
  isBookTracked: (id: number) => boolean;
  getTrackedBooks: () => Book[];
  getTrackedBookStatus: (id: number) => BookTracking | null;
  clearTrackedBooks: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  trackedBooks: {},
  isLoading: false,
  isUpdating: {},
  error: null,
  updateError: {},

  fetchTrackedBooks: async () => {
    set({ isLoading: true, error: null });
    try {
      // Assuming getMyLibraryBooks fetches all books or a reasonable first page
      // The API returns BookResponse[], which needs transformation.
      const libraryBooksResponse = await getMyLibraryBooks({ limit: 1000, offset: 0 }); // Fetch a large number for now
      
      const booksMap: Record<number, Book> = {};
      libraryBooksResponse.forEach((bookRes: BookResponse) => {
        // Assuming BookResponse has 'book' and 'tracking_info'
        // And Book type should accommodate this structure or be transformed
        // Assuming BookResponse has 'book' (type Book) and 'tracking_info' (type BookTracking)
        // And the Book type in our store should consolidate these.
        const bookDataFromApi = bookRes.book;
        const trackingDataFromApi = bookRes.tracking_info;

        const book: Book = {
          ...bookDataFromApi,
          tracking: true, // Mark as tracked
          // Explicitly map fields from tracking_info to the Book object if they exist
          // This depends on the definition of your Book type and BookTracking type
          ...(trackingDataFromApi?.status && { tracking_status: trackingDataFromApi.status }),
          ...(trackingDataFromApi?.current_chapter && { chapters_read: trackingDataFromApi.current_chapter }),
          // Add other relevant fields from tracking_info as needed by Book type
        };
        booksMap[bookDataFromApi.id] = book;
      });
      set({ trackedBooks: booksMap, isLoading: false });
    } catch (err) {
      console.error('Error fetching tracked books:', err);
      set({ error: 'Failed to fetch tracked books', isLoading: false });
    }
  },

  addTrackedBook: async (book: Book) => {
    const bookId = book.id;
    set(state => ({
      isUpdating: { ...state.isUpdating, [bookId]: true },
      updateError: { ...state.updateError, [bookId]: null },
    }));
    try {
      // API expects bookId as string
      const trackingInfo = await addBookToTracking({ book_id: String(bookId) }); 
      set(state => ({
        trackedBooks: {
          ...state.trackedBooks,
          [bookId]: {
            ...book,
            tracking: true,
            // Assuming trackingInfo from API (type BookTracking) contains status, current_chapter etc.
            ...(trackingInfo.status && { tracking_status: trackingInfo.status }),
            ...(trackingInfo.current_chapter && { chapters_read: trackingInfo.current_chapter }),
            // updated_at could also come from trackingInfo if the backend provides it
            updated_at: trackingInfo.updated_at ? new Date(trackingInfo.updated_at) : new Date(),
          }
        },
        isUpdating: { ...state.isUpdating, [bookId]: false },
      }));
    } catch (err) {
      console.error(`Error adding book ${bookId} to tracking:`, err);
      set(state => ({
        updateError: { ...state.updateError, [bookId]: `Failed to add ${bookId} to tracking` },
        isUpdating: { ...state.isUpdating, [bookId]: false },
      }));
    }
  },

  removeTrackedBook: async (bookId: number) => {
    set(state => ({
      isUpdating: { ...state.isUpdating, [bookId]: true },
      updateError: { ...state.updateError, [bookId]: null },
    }));
    try {
      // API expects bookId as string
      await removeBookFromTracking({ book_id: String(bookId) });
      set(state => {
        const { [bookId]: _, ...rest } = state.trackedBooks;
        return {
          trackedBooks: rest,
          isUpdating: { ...state.isUpdating, [bookId]: false },
        };
      });
    } catch (err) {
      console.error(`Error removing book ${bookId} from tracking:`, err);
      set(state => ({
        updateError: { ...state.updateError, [bookId]: `Failed to remove ${bookId}` },
        isUpdating: { ...state.isUpdating, [bookId]: false },
      }));
    }
  },

  updateTrackedBook: async (bookId: number, data: Partial<BookTracking> & { book?: Partial<Book> }) => {
    set(state => ({
      isUpdating: { ...state.isUpdating, [bookId]: true },
      updateError: { ...state.updateError, [bookId]: null },
    }));
    try {
      // API expects bookId as string and data as BookTracking type.
      // We need to map the input 'data' to what the API expects.
      // For now, assuming data directly matches or can be cast to BookTracking for the API.
      // The API might return the updated BookTracking object or the full Book object.
      const updatedTrackingInfo = await updateBookTracking({ book_id: String(bookId), ...data });
      
      set(state => {
        const existingBook = state.trackedBooks[bookId] || {};
        const updatedBookData = data.book || {}; // If partial book data is passed

        return {
          trackedBooks: {
            ...state.trackedBooks,
            [bookId]: {
              ...existingBook, // Keep existing book properties
              ...updatedBookData, // Apply partial updates to book details from data.book
              // Update tracking specific fields based on updatedTrackingInfo (type BookTracking)
              ...(updatedTrackingInfo.status && { tracking_status: updatedTrackingInfo.status }),
              ...(updatedTrackingInfo.current_chapter && { chapters_read: updatedTrackingInfo.current_chapter }),
              // updated_at could also come from updatedTrackingInfo if the backend provides it
              updated_at: updatedTrackingInfo.updated_at ? new Date(updatedTrackingInfo.updated_at) : new Date(),
            }
          },
          isUpdating: { ...state.isUpdating, [bookId]: false },
        };
      });
    } catch (err) {
      console.error(`Error updating book ${bookId} tracking:`, err);
      set(state => ({
        updateError: { ...state.updateError, [bookId]: `Failed to update ${bookId}` },
        isUpdating: { ...state.isUpdating, [bookId]: false },
      }));
    }
  },

  isBookTracked: (id: number) => Boolean(get().trackedBooks[id]),
  getTrackedBooks: () => Object.values(get().trackedBooks),
  // Assuming tracking_status is a direct property of the Book object in trackedBooks
  getTrackedBookStatus: (id: number) => get().trackedBooks[id]?.tracking_status || null,
  
  clearTrackedBooks: () => set({
    trackedBooks: {},
    isLoading: false,
    isUpdating: {},
    error: null,
    updateError: {},
  }),
}));