import { create } from 'zustand';
import { getMyLists, getList, getBook } from '@/services/api';
import { addBookToList, createList, removeBookFromList } from '@/services/api/list';
import { Book, List } from '@/types';

export interface ListState {
  myListsById: Record<string, List>;
  myListsIds: number[];
  readingListsById: Record<string, List>;
  isLoading: boolean;
  error: string | null;
  createList: (name: string) => Promise<List | undefined>;
  addBookToList: (listId: number, bookId: number) => Promise<void>;
  removeBookFromList: (listId: number, bookId: number) => Promise<void>;
  getListsContainingBook: (bookId: number) => Promise<number[]>;
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
        // Also update readingListsById if the list is loaded there
        readingListsById: state.readingListsById[listId] ? {
          ...state.readingListsById,
          [listId]: {
            ...state.readingListsById[listId],
            books: state.readingListsById[listId].books 
              ? [...state.readingListsById[listId].books, book]
              : [book],
            total_books: (state.readingListsById[listId].total_books || 0) + 1,
          }
        } : state.readingListsById,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur d\'ajout du livre à la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeBookFromList: async (listId: number, bookId: number) => {
    set({ isLoading: true, error: null });
    try {
      await removeBookFromList(listId, bookId);
      
      // Fetch the book details to get the cover image to remove
      const book = await getBook({ id: bookId.toString() });
      
      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: {
            ...state.myListsById[listId],
            total_books: Math.max(0, state.myListsById[listId].total_books - 1),
            first_book_covers: (() => {
              const covers = state.myListsById[listId].first_book_covers || [];
              // Remove the book's cover if it's present in first_book_covers
              return covers.filter(cover => cover !== book.cover_image);
            })(),
          }
        },
        // Also update readingListsById if the list is loaded there
        readingListsById: state.readingListsById[listId] ? {
          ...state.readingListsById,
          [listId]: {
            ...state.readingListsById[listId],
            books: state.readingListsById[listId].books 
              ? state.readingListsById[listId].books.filter(b => b.id !== bookId)
              : [],
            total_books: Math.max(0, (state.readingListsById[listId].total_books || 0) - 1),
          }
        } : state.readingListsById,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de suppression du livre de la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  getListsContainingBook: async (bookId: number) => {
    const { myListsIds } = get();
    const listsContainingBook: number[] = [];
    
    // Pour chaque liste, récupérer ses livres et vérifier si le livre est présent
    await Promise.all(
      myListsIds.map(async (listId) => {
        try {
          const list = await getList(listId.toString());
          if (list.books && list.books.some(book => book.id === bookId)) {
            listsContainingBook.push(listId);
          }
        } catch (error) {
          console.warn(`Erreur lors de la vérification de la liste ${listId}:`, error);
        }
      })
    );
    
    return listsContainingBook;
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