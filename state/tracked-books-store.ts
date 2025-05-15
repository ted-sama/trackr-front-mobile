import { create } from 'zustand';
import { Book, BookTracking } from '@/types';

interface TrackedBooksState {
  trackedBooks: Record<number, Book>;
  addTrackedBook: (book: Book) => void;
  removeTrackedBook: (id: number) => void;
  isBookTracked: (id: number) => boolean;
  getTrackedBooks: () => Book[];
  getTrackedBookStatus: (id: number) => BookTracking | null;
  clearTrackedBooks: () => void;
}

export const useTrackedBooksStore = create<TrackedBooksState>((set, get) => ({
  trackedBooks: {},
  addTrackedBook: (book) => set((state) => ({
    trackedBooks: { ...state.trackedBooks, [book.id]: book },
  })),
  removeTrackedBook: (id) => set((state) => {
    const { [id]: _, ...rest } = state.trackedBooks;
    return { trackedBooks: rest };
  }),
  isBookTracked: (id) => Boolean(get().trackedBooks[id]),
  getTrackedBooks: () => Object.values(get().trackedBooks),
  getTrackedBookStatus: (id) => get().trackedBooks[id]?.tracking_status || null,
  clearTrackedBooks: () => set({ trackedBooks: {} }),
})); 