import { create } from 'zustand';
import { api } from '@/services/api';
import { Book } from '@/types/book';

export interface BookDetailState {
  bookById: Record<string, Book | null>;
  isLoading: boolean;
  error: string | null;
  fetchBook: (id: string) => Promise<void>;
  getRecap: (bookId: string, chapter: number) => Promise<string | null>;
}

export const useBookDetailStore = create<BookDetailState>((set) => ({
  bookById: {},
  isLoading: false,
  error: null,

  fetchBook: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Book>(`/books/${id}`);
      const book = response.data;
      set((state) => ({
        bookById: { ...state.bookById, [id]: book },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement du livre' });
    } finally {
      set({ isLoading: false });
    }
  },

  getRecap: async (bookId: string, chapter: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<string>(`/books/${bookId}/recap/${chapter}`);
      return response.data;
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement du récapitulatif' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  }
})); 