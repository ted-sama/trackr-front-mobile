import { create } from 'zustand';
import { getBook } from '@/api';
import { Book } from '@/types';

export interface BookDetailState {
  bookById: Record<string, Book | null>;
  isLoading: boolean;
  error: string | null;
  fetchBook: (id: string) => Promise<void>;
}

export const useBookDetailStore = create<BookDetailState>((set) => ({
  bookById: {},
  isLoading: false,
  error: null,

  fetchBook: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const book = await getBook({ id });
      set((state) => ({
        bookById: { ...state.bookById, [id]: book },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement du livre' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 