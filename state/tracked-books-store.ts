import { create } from 'zustand';
import { Book } from '@/types';

interface TrackedBooksState {
  trackedBooks: Record<number, Book>;
  addTrackedBook: (book: Book) => void;
  removeTrackedBook: (id: number) => void;
  isBookTracked: (id: number) => boolean;
  getTrackedBooks: () => Book[];
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
})); 