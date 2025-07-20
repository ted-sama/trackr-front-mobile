import { create } from 'zustand';
import { Book } from '@/types/book';
import { List } from '@/types/list';
import { api } from '@/services/api';
import { ImagePickerAsset } from 'expo-image-picker';
import { PaginatedResponse } from '@/types/api';

export interface ListState {
  listsById: Record<string, List>;
  listsIds: string[];
  myListsById: Record<string, List>;
  myListsIds: string[];
  isLoading: boolean;
  error: string | null;
  createList: (name: string) => Promise<List | undefined>;
  updateList: (listId: string, updatedList: Partial<List>) => Promise<void>;
  addBookToList: (listId: string, bookId: string) => Promise<void>;
  removeBookFromList: (listId: string, bookId: string) => Promise<void>;
  reorderBooksInList: (listId: string, positions: string[]) => Promise<void>;
  getListsContainingBook: (bookId: string) => Promise<string[]>;
  fetchLists: () => Promise<void>;
  fetchMyLists: () => Promise<void>;
  fetchList: (id: string) => Promise<void>;
  isOwner: (listId: string) => boolean;
  deleteList: (listId: string) => Promise<void>;
  updateBackdropImage: (listId: string, image: ImagePickerAsset) => Promise<void>;
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
      const response = await api.post<List>('/lists', { name });
      const newList = response.data;
      set({ myListsById: { ...get().myListsById, [String(newList.id)]: newList }, myListsIds: [...get().myListsIds, String(newList.id)] });
      return newList;
    } catch (e: any) {
      set({ error: e.message || 'Erreur de création de la liste' });
      return undefined;
    } finally {
      set({ isLoading: false });
    }
  },

  updateList: async (listId: string, updatedList: Partial<List>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<List>(`/lists/${listId}`, updatedList);
      const freshList = response.data;
      set(state => {
        return {
          myListsById: {
            ...state.myListsById,
            [listId]: freshList,
          },
          listsById: state.listsById[listId] ? {
            ...state.listsById,
            [listId]: freshList,
          } : state.listsById,
        };
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de mise à jour de la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  addBookToList: async (listId: string, bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/lists/${listId}/books`, { bookId: bookId });
      const response = await api.get<Book>(`/books/${bookId}`);
      const book = response.data;

      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: {
            ...state.myListsById[listId],
            books: {
              ...state.myListsById[listId].books,
              total: state.myListsById[listId].books.total + 1,
              items: [...state.myListsById[listId].books.items, book],
            },
          }
        },
        listsById: state.listsById[listId] ? {
          ...state.listsById,
          [listId]: {
            ...state.listsById[listId],
            books: state.listsById[listId].books?.items
              ? {
                total: state.listsById[listId].books.total + 1,
                items: [...state.listsById[listId].books.items, book]
              }
              : {
                total: 1,
                items: [book]
              },
          }
        } : state.listsById,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur d\'ajout du livre à la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeBookFromList: async (listId: string, bookId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/lists/${listId}/books`, { data: { bookId: bookId } });

      const response = await api.get<Book>(`/books/${bookId}`);
      const book = response.data;

      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: {
            ...state.myListsById[listId],
            books: {
              ...state.myListsById[listId].books,
              total: Math.max(0, state.myListsById[listId].books.total - 1),
              items: state.myListsById[listId].books.items.filter(b => b.id !== bookId)
            },
          }
        },
        listsById: state.listsById[listId] ? {
          ...state.listsById,
          [listId]: {
            ...state.listsById[listId],
            books: state.listsById[listId].books?.items
              ? {
                total: Math.max(0, state.listsById[listId].books.total - 1),
                items: state.listsById[listId].books.items.filter(b => b.id !== bookId)
              }
              : {
                total: 0,
                items: []
              },
          }
        } : state.listsById,
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de suppression du livre de la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  reorderBooksInList: async (listId: string, positions: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/lists/${listId}/books/reorder`, { bookIds: positions });
      await get().fetchList(listId);
      // TODO: update local books by fetching the list again
      const list = await api.get<List>(`/lists/${listId}`);
      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: list.data,
        },
        listsById: {
          ...state.listsById,
          [listId]: list.data,
        },
      }));
    } catch (e: any) {
      set({ error: e.message || 'Erreur de réordonnancement du livre dans la liste' });
    } finally {
      set({ isLoading: false });
    }
  },

  getListsContainingBook: async (bookId: string) => {
    const { myListsIds } = get();
    const listsContainingBook: string[] = [];

    await Promise.all(
      myListsIds.map(async (listId) => {
        try {
          const response = await api.get<List>(`/lists/${listId}`);
          const list = response.data;
          if (list.books?.items && list.books.items.some(book => book.id === bookId)) {
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
      const response = await api.get<PaginatedResponse<List>>('/lists');
      set({
        listsById: response.data.data.reduce<Record<string, List>>((acc: Record<string, List>, list: List) => {
          acc[list.id] = list;
          return acc;
        }, {}), listsIds: response.data.data.map((l: List) => String(l.id))
      });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement des listes' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<List>>('/me/lists');
      const lists = response.data.data;
      const byId = lists.reduce<Record<string, List>>((acc, list) => {
        acc[list.id] = list;
        return acc;
      }, {});
      set({ myListsById: byId, myListsIds: lists.map(l => String(l.id)) });
    } catch (e: any) {
      set({ error: e.message || 'Erreur de chargement des listes' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchList: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<List>(`/lists/${id}`);
      const list = response.data;
      set(state => {
        const existingList = state.listsById[id];
        const mergedList = existingList ? {
          ...list,
          books: existingList.books || {
            total: 0,
            items: [],
          },
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

  deleteList: async (listId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/lists/${listId}`);
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

  updateBackdropImage: async (listId: string, image: ImagePickerAsset) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      const uri = image.uri;
      const fileName = image.fileName || uri.split('/').pop() || 'photo.jpg';
      const mimeType = image.mimeType || 'image/jpeg';

      const imagePayload: any = {
        uri: uri,
        name: fileName,
        type: mimeType,
      }
      formData.append('backdrop', imagePayload);

      const response = await api.put(`/lists/${listId}/backdrop`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await get().fetchList(String(listId));
    } catch (e: any) {
      set({ error: e.message || "Erreur de mise à jour de l'image de la liste" });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  isOwner: (listId: string) => {
    const { myListsIds } = get();
    return myListsIds.includes(listId);
  },
})); 