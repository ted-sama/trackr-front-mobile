import { create } from 'zustand';
import { Book, TrackedBookWithMeta } from '@/types/book';
import { BookTracking, ReadingStatus } from '@/types/reading-status';
import { api } from '@/services/api';
import { PaginatedResponse } from '@/types/api';
import { TrackedBook } from '@/types/tracked-book';

interface TrackedBooksState {
  trackedBooks: Record<string, TrackedBookWithMeta>;
  isLoading: boolean;
  error: string | null;
  addTrackedBook: (book: Book) => Promise<void>;
  removeTrackedBook: (id: string) => Promise<void>;
  updateTrackedBook: (id: string | number, tracking: Partial<BookTracking>) => Promise<void>;
  isBookTracked: (id: string | number) => boolean;
  getTrackedBooks: () => TrackedBookWithMeta[];
  getTrackedBookStatus: (id: string | number) => BookTracking | null;
  clearTrackedBooks: () => void;
  fetchMyLibraryBooks: () => Promise<void>;
  checkBookTrackedServer: (id: string) => Promise<BookTracking | null>;
  refreshBookTracking: (id: string) => Promise<void>;
}

export const useTrackedBooksStore = create<TrackedBooksState>((set, get) => ({
  trackedBooks: {},
  isLoading: false,
  error: null,

  addTrackedBook: async (book) => {
    const { refreshBookTracking } = get();
    // Optimistically add the book to the UI
    const optimisticTracking: BookTracking = {
      status: 'plan_to_read',
      createdAt: new Date(),
    };
    const bookKey = String(book.id);
    set((state) => ({
      trackedBooks: {
        ...state.trackedBooks,
        [bookKey]: {
          ...book,
          tracking: true,
          trackingStatus: optimisticTracking,
        },
      },
    }));

    set({ isLoading: true, error: null });
    try {
      await api.post(`/me/books/${book.id}`);
      // Refresh the book data from the server to get the full tracking object
      await refreshBookTracking(String(book.id));
    } catch (e: any) {
      // Revert optimistic update on failure
      const bookKey = String(book.id);
      set((state) => {
        const { [bookKey]: _, ...rest } = state.trackedBooks;
        return { trackedBooks: rest, error: e.message || "Erreur lors de l'ajout du suivi" };
      });
    } finally {
      set({ isLoading: false });
    }
  },

  removeTrackedBook: async (id) => {
    const bookKey = String(id);
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/me/books/${id}`);
      set((state) => {
        const { [bookKey]: _, ...rest } = state.trackedBooks;
        return { trackedBooks: rest };
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors de la suppression du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTrackedBook: async (id, tracking) => {
    const bookKey = String(id);
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<TrackedBook>(`/me/books/${id}`, tracking);
      const trackedBook = response.data;
      
      if (!trackedBook || !trackedBook.book) {
        throw new Error('Invalid response from server');
      }

      const freshBook = trackedBook.book;
      const updatedTracking: BookTracking = {
        status: trackedBook.status as ReadingStatus,
        currentChapter: trackedBook.currentChapter,
        currentVolume: trackedBook.currentVolume,
        rating: trackedBook.rating,
        startDate: trackedBook.startDate ? new Date(trackedBook.startDate) : null,
        finishDate: trackedBook.finishDate ? new Date(trackedBook.finishDate) : null,
        notes: trackedBook.notes,
        lastReadAt: trackedBook.lastReadAt ? new Date(trackedBook.lastReadAt) : null,
        createdAt: trackedBook.createdAt ? new Date(trackedBook.createdAt) : null,
        updatedAt: trackedBook.updatedAt ? new Date(trackedBook.updatedAt) : null,
      };
      
      // Ensure the book ID is consistent
      if (String(freshBook.id) !== bookKey) {
        console.warn(`Book ID mismatch: expected ${bookKey}, received ${freshBook.id}`);
      }

      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [bookKey]: { 
            ...freshBook, 
            tracking: true, 
            trackingStatus: updatedTracking,
          },
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors de la mise à jour du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },

  isBookTracked: (id) => Boolean(get().trackedBooks[String(id)]?.tracking),

  getTrackedBooks: () => {
    const books = Object.values(get().trackedBooks);
    // Filter out any books that don't have a valid ID to prevent rendering issues
    return books.filter(book => book && book.id);
  },

  getTrackedBookStatus: (id) => get().trackedBooks[String(id)]?.trackingStatus || null,

  clearTrackedBooks: () => set({ trackedBooks: {} }),

  fetchMyLibraryBooks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<TrackedBook>>('/me/books?offset=0&limit=1000');
      const books: Record<string, TrackedBookWithMeta> = {};
      for (const trackedBook of response.data.data) {
        const bookData = trackedBook.book;
        
        if (!bookData || !bookData.id) {
          console.warn('TrackedBooksStore - Invalid book data, skipping:', trackedBook);
          continue;
        }
        
        const trackingStatus: BookTracking = {
          status: trackedBook.status as ReadingStatus,
          currentChapter: trackedBook.currentChapter,
          currentVolume: trackedBook.currentVolume,
          rating: trackedBook.rating,
          startDate: trackedBook.startDate ? new Date(trackedBook.startDate) : null,
          finishDate: trackedBook.finishDate ? new Date(trackedBook.finishDate) : null,
          notes: trackedBook.notes,
          lastReadAt: trackedBook.lastReadAt ? new Date(trackedBook.lastReadAt) : null,
          createdAt: trackedBook.createdAt ? new Date(trackedBook.createdAt) : null,
          updatedAt: trackedBook.updatedAt ? new Date(trackedBook.updatedAt) : null,
        };
        books[String(bookData.id)] = { ...bookData, tracking: true, trackingStatus: trackingStatus };
      }
      set({ trackedBooks: books });
    } catch (e: any) {
      console.error('TrackedBooksStore - Error fetching books:', e);
      set({ error: e.message || 'Erreur de chargement de la bibliothèque' });
    } finally {
      set({ isLoading: false });
    }
  },

  checkBookTrackedServer: async (id) => {
    try {
      const response = await api.get<BookTracking>(`/me/books/contains/${id}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  refreshBookTracking: async (id) => {
    const bookKey = String(id);
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Book>(`/books/${id}`);
      const freshBook = response.data;
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [bookKey]: { ...freshBook, tracking: true, trackingStatus: state.trackedBooks[bookKey]?.trackingStatus },
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors du rafraîchissement du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 