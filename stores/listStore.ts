import { create } from 'zustand';
import { getMyLists, getList, getBook } from '@/services/api';
import { addBookToList, createList } from '@/services/api/list';
import { Book, List } from '@/types';

export interface ListState {
  myListsById: Record<string, List>;
  myListsIds: number[];
  readingListsById: Record<string, List>;
  isLoading: boolean;
  error: string | null;
  createList: (name: string) => Promise<List | undefined>;
  addBookToList: (listId: number, bookId: number) => Promise<void>;
  fetchMyLists: () => Promise<void>;
  fetchList: (id: string) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  myListsById: {},
  myListsIds: [],
  readingListsById: {},
  isLoading: false,
  error: null,

  createList: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const newList = await createList(name);
      set({ myListsById: { ...get().myListsById, [newList.id]: newList }, myListsIds: [...get().myListsIds, newList.id] });
      return newList;
    } catch (e: any) {
      set({ error: e.message || 'Erreur de création de la liste' });
      return undefined;
    } finally {
      set({ isLoading: false });
    }
  },

  addBookToList: async (listId: number, bookId: number) => {
    set({ isLoading: true, error: null });
    try {
      await addBookToList(listId, bookId);
      // Fetch the book details to get the cover image
      const book = await getBook({ id: bookId.toString() });
      
      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: {
            ...state.myListsById[listId],
            total_books: state.myListsById[listId].total_books + 1,
            first_book_covers: (() => {
              const covers = state.myListsById[listId].first_book_covers
                ? [...state.myListsById[listId].first_book_covers]
                : [];
              // Only add if less than 3 covers and bookId is not already present
              if (covers.length < 3 && book.cover_image) {
                covers.push(book.cover_image);
              }
              return covers;
            })(),
          }
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur d\'ajout du livre à la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMyLists();
      const lists = response.items;
      const byId = lists.reduce<Record<string, List>>((acc, list) => {
        acc[list.id] = list;
        return acc;
      }, {});
      set({ myListsById: byId, myListsIds: lists.map(l => l.id) });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement des listes' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchList: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const list = await getList(id);
      set(state => ({
        readingListsById: { ...state.readingListsById, [id]: list },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement de la liste' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 