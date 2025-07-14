import { create } from 'zustand';
import { Book } from '@/types/book';
import { BookTracking } from '@/types/reading-status';
import { api } from '@/services/api';
import { PaginatedResponse } from '@/types/api';

interface TrackedBooksState {
  trackedBooks: Record<number, Book>;
  isLoading: boolean;
  error: string | null;
  addTrackedBook: (book: Book) => Promise<void>;
  removeTrackedBook: (id: number) => Promise<void>;
  updateTrackedBook: (id: number, tracking: Partial<BookTracking>) => Promise<void>;
  isBookTracked: (id: number) => boolean;
  getTrackedBooks: () => Book[];
  getTrackedBookStatus: (id: number) => BookTracking | null;
  clearTrackedBooks: () => void;
  fetchMyLibraryBooks: () => Promise<void>;
  checkBookTrackedServer: (id: number) => Promise<BookTracking | null>;
  refreshBookTracking: (id: number) => Promise<void>;
}

export const useTrackedBooksStore = create<TrackedBooksState>((set, get) => ({
  trackedBooks: {},
  isLoading: false,
  error: null,

  addTrackedBook: async (book) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/me/books`, { id: book.id });
      const tracking: BookTracking = response.data.bookTracking;
      const freshBook = response.data.book;
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [book.id]: { ...freshBook, tracking: true, trackingStatus: tracking },
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors de l’ajout du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeTrackedBook: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/me/books`, { data: { id } });
      set((state) => {
        const { [id]: _, ...rest } = state.trackedBooks;
        return { trackedBooks: rest };
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors de la suppression du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTrackedBook: async (id, tracking) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/me/books/${id}`, tracking);
      const updatedTracking: BookTracking = response.data.bookTracking;
      const freshBook = response.data.book;
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [id]: { ...freshBook, tracking: true, trackingStatus: updatedTracking },
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors de la mise à jour du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },

  isBookTracked: (id) => Boolean(get().trackedBooks[id]?.tracking),

  getTrackedBooks: () => Object.values(get().trackedBooks),

  getTrackedBookStatus: (id) => get().trackedBooks[id]?.trackingStatus || null,

  clearTrackedBooks: () => set({ trackedBooks: {} }),

  fetchMyLibraryBooks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Book>>('/me/books?offset=0&limit=1000');
      const books: Record<number, Book> = {};
      for (const book of response.data.data) {
        books[book.id] = { ...book, tracking: true, trackingStatus: book.trackingStatus };
      }
      set({ trackedBooks: books });
    } catch (e: any) {
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
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Book>(`/books/${id}`);
      const freshBook = response.data;
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [id]: { ...freshBook, tracking: true, trackingStatus: freshBook.trackingStatus },
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors du rafraîchissement du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 