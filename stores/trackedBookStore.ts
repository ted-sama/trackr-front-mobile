import { create } from 'zustand';
import { Book, BookTracking } from '@/types';

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
      const { addBookToTracking, getBook } = await import('@/services/api');
      const tracking = await addBookToTracking(String(book.id));
      // On récupère le book complet pour avoir toutes les infos à jour
      const freshBook = await getBook({ id: String(book.id) });
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [book.id]: { ...freshBook, tracking: true, tracking_status: tracking },
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
      const { removeBookFromTracking } = await import('@/services/api');
      await removeBookFromTracking(String(id));
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
      const { updateBookTracking, getBook } = await import('@/services/api');
      const updatedTracking = await updateBookTracking({ bookId: String(id), ...tracking });
      // On récupère le book complet pour avoir toutes les infos à jour
      const freshBook = await getBook({ id: String(id) });
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [id]: { ...freshBook, tracking: true, tracking_status: updatedTracking },
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

  getTrackedBookStatus: (id) => get().trackedBooks[id]?.tracking_status || null,

  clearTrackedBooks: () => set({ trackedBooks: {} }),

  fetchMyLibraryBooks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { getMyLibraryBooks, getBook } = await import('@/services/api');
      const response = await getMyLibraryBooks({ offset: 0, limit: 1000 });
      const books: Record<number, Book> = {};
      for (const book of response.items) {
        // On récupère le book complet pour avoir toutes les infos à jour
        const freshBook = await getBook({ id: String(book.id) });
        books[book.id] = { ...freshBook, tracking: true, tracking_status: book.tracking_status };
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
      const { checkIfBookIsTracked } = await import('@/services/api');
      const tracking = await checkIfBookIsTracked(String(id));
      return tracking || null;
    } catch {
      return null;
    }
  },

  refreshBookTracking: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { getBook } = await import('@/services/api');
      const freshBook = await getBook({ id: String(id) });
      set((state) => ({
        trackedBooks: {
          ...state.trackedBooks,
          [id]: { ...freshBook, tracking: true, tracking_status: freshBook.tracking_status },
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur lors du rafraîchissement du suivi' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 