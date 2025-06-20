import { create } from 'zustand';
import { getMyLists, getList, getBook } from '@/services/api';
import { addBookToList, createList, getLists, removeBookFromList, updateList, reorderBookInList, reorderBooksInListBulk, deleteList as deleteListAPI, updateListImage as updateListImageAPI } from '@/services/api/list';
import { Book, List } from '@/types';
import { ImagePickerAsset } from 'expo-image-picker';

export interface ListState {
  listsById: Record<string, List>;
  listsIds: number[];
  myListsById: Record<string, List>;
  myListsIds: number[];
  isLoading: boolean;
  error: string | null;
  createList: (name: string) => Promise<List | undefined>;
  updateList: (listId: number, updatedList: Partial<List>) => Promise<void>;
  addBookToList: (listId: number, bookId: number) => Promise<void>;
  removeBookFromList: (listId: number, bookId: number) => Promise<void>;
  reorderBookInList: (listId: number, bookId: number, newPosition: number) => Promise<void>;
  reorderBooksInListBulk: (listId: number, bookOrders: { bookId: number; position: number }[]) => Promise<void>;
  getListsContainingBook: (bookId: number) => Promise<number[]>;
  fetchLists: () => Promise<void>;
  fetchMyLists: () => Promise<void>;
  fetchList: (id: string) => Promise<void>;
  isOwner: (listId: number) => boolean;
  deleteList: (listId: number) => Promise<void>;
  updateListImage: (listId: number, image: ImagePickerAsset) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  listsById: {},
  listsIds: [],
  myListsById: {},
  myListsIds: [],
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

  updateList: async (listId: number, updatedList: Partial<List>) => {
    set({ isLoading: true, error: null });
    try {
      const freshList = await updateList(listId, updatedList);
      set(state => {
        const existingMyList = state.myListsById[listId];
        const existingPublicList = state.listsById[listId];
        
        // Preserve metadata from existing list if it exists
        const mergedMyList = existingMyList ? {
          ...freshList,
          // Preserve collection metadata
          total_books: existingMyList.total_books || 0,
          first_book_covers: existingMyList.first_book_covers || [],
        } : freshList;
        
        const mergedPublicList = existingPublicList ? {
          ...freshList,
          // Preserve collection metadata
          total_books: existingPublicList.total_books || 0,
          first_book_covers: existingPublicList.first_book_covers || [],
        } : freshList;
        
        return {
          myListsById: {
            ...state.myListsById,
            [listId]: mergedMyList,
          },
          // Also update listsById if the list is loaded there
          listsById: state.listsById[listId] ? {
            ...state.listsById,
            [listId]: mergedPublicList,
          } : state.listsById,
        };
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de mise à jour de la liste' });
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
        // Also update listsById if the list is loaded there
        listsById: state.listsById[listId] ? {
          ...state.listsById,
          [listId]: {
            ...state.listsById[listId],
            books: state.listsById[listId].books 
              ? [...state.listsById[listId].books, book]
              : [book],
            total_books: (state.listsById[listId].total_books || 0) + 1,
          }
        } : state.listsById,
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
        // Also update listsById if the list is loaded there
        listsById: state.listsById[listId] ? {
          ...state.listsById,
          [listId]: {
            ...state.listsById[listId],
            books: state.listsById[listId].books 
              ? state.listsById[listId].books.filter(b => b.id !== bookId)
              : [],
            total_books: Math.max(0, (state.listsById[listId].total_books || 0) - 1),
          }
        } : state.listsById,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de suppression du livre de la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  reorderBookInList: async (listId: number, bookId: number, newPosition: number) => {
    set({ isLoading: true, error: null });
    try {
      await reorderBookInList(listId, bookId, newPosition);
      // Refetch the list from backend to get the correct order and covers
      await get().fetchList(String(listId));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de réordonnancement du livre dans la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  reorderBooksInListBulk: async (listId: number, bookOrders: { bookId: number; position: number }[]) => {
    set({ isLoading: true, error: null });
    try {
      await reorderBooksInListBulk(listId, bookOrders);
      // Refetch the list from backend to get the correct order and covers
      await get().fetchList(String(listId));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de réordonnancement des livres dans la liste' });
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

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getLists();
      set({ listsById: response.items.reduce<Record<string, List>>((acc: Record<string, List>, list: List) => {
        acc[list.id] = list;
        return acc;
      }, {}), listsIds: response.items.map((l: List) => l.id) });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement des listes' });
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
      set(state => {
        const existingList = state.listsById[id];
        // If there's an existing list, preserve important metadata
        const mergedList = existingList ? {
          ...list,
          // Preserve metadata from collections if they exist
          first_book_covers: existingList.first_book_covers || list.first_book_covers,
          total_books: existingList.total_books || list.total_books,
        } : list;
        
        return {
          listsById: { ...state.listsById, [id]: mergedList },
        };
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement de la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteList: async (listId: number) => {
    set({ isLoading: true, error: null });
    try {
      await deleteListAPI(listId);
      set(state => {
        const newMyListsById = { ...state.myListsById };
        delete newMyListsById[listId];
        const newMyListsIds = state.myListsIds.filter(id => id !== listId);

        const newListsById = { ...state.listsById };
        let newListsIds = [...state.listsIds];
        if (newListsById[listId]) {
          delete newListsById[listId];
          newListsIds = state.listsIds.filter(id => id !== listId);
        }

        return {
          myListsById: newMyListsById,
          myListsIds: newMyListsIds,
          listsById: newListsById,
          listsIds: newListsIds,
        };
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de suppression de la liste' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateListImage: async (listId: number, image: ImagePickerAsset) => {
    set({ isLoading: true, error: null });
    try {
      await updateListImageAPI(listId, image);
      await get().fetchList(String(listId)); // Refetch to get new image URL
    } catch (e: any) {
      set({ error: e.message || "Erreur de mise à jour de l'image de la liste" });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  isOwner: (listId: number) => {
    const { myListsIds } = get();
    return myListsIds.includes(listId);
  },
})); 