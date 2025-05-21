import { create } from 'zustand';
import { Book, BookTracking } from '@/types';

interface TrackedBooksState {
  trackedBooks: Record<number, Book>;
  isLoading: boolean;
  error: string | null;
  addTrackedBook: (book: Book) => void;
  removeTrackedBook: (id: number) => void;
  updateTrackedBook: (id: number, book: Book) => void;
  isBookTracked: (id: number) => boolean;
  getTrackedBooks: () => Book[];
  getTrackedBookStatus: (id: number) => BookTracking | null;
  clearTrackedBooks: () => void;
  fetchMyLibraryBooks: () => Promise<void>;
}

export const useTrackedBooksStore = create<TrackedBooksState>((set, get) => ({
  trackedBooks: {},
  isLoading: false,
  error: null,
  addTrackedBook: (book) => set((state) => ({
    trackedBooks: { ...state.trackedBooks, [book.id]: { ...book, updated_at: new Date() } },
  })),
  removeTrackedBook: (id) => set((state) => {
    const { [id]: _, ...rest } = state.trackedBooks;
    return { trackedBooks: rest };
  }),
  updateTrackedBook: (id, book) => set((state) => ({
    trackedBooks: { ...state.trackedBooks, [id]: { ...book, updated_at: new Date() } },
  })),
  isBookTracked: (id) => Boolean(get().trackedBooks[id]),
  getTrackedBooks: () => Object.values(get().trackedBooks),
  getTrackedBookStatus: (id) => get().trackedBooks[id]?.tracking_status || null,
  clearTrackedBooks: () => set({ trackedBooks: {} }),
  fetchMyLibraryBooks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { getMyLibraryBooks } = await import('@/api');
      const response = await getMyLibraryBooks({ offset: 0, limit: 1000 });
      const add = get().addTrackedBook;
      response.items.forEach(book => {
        add({ ...book, tracking: true, tracking_status: book.tracking_status });
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement de la bibliothèque' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 