import { create } from 'zustand';
import { Book } from '@/types/book';
import { List } from '@/types/list';
import { api } from '@/services/api';
import { ImagePickerAsset } from 'expo-image-picker';
import { PaginatedResponse } from '@/types/api';

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
      const response = await api.post<{ list: List }>('/lists', { name });
      const newList = response.data.list;
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
      const response = await api.patch<{ list: List }>(`/lists/${listId}`, updatedList);
      const freshList = response.data.list;
      set(state => {
        const existingMyList = state.myListsById[listId];
        const existingPublicList = state.listsById[listId];
        
        const mergedMyList = existingMyList ? {
          ...freshList,
          totalBooks: existingMyList.totalBooks || 0,
          firstBookCovers: existingMyList.firstBookCovers || [],
        } : freshList;
        
        const mergedPublicList = existingPublicList ? {
          ...freshList,
          totalBooks: existingPublicList.totalBooks || 0,
          firstBookCovers: existingPublicList.firstBookCovers || [],
        } : freshList;
        
        return {
          myListsById: {
            ...state.myListsById,
            [listId]: mergedMyList,
          },
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
      await api.post(`/lists/${listId}/books`, { id: bookId });
      const response = await api.get<Book>(`/books/${bookId}`);
      const book = response.data;
      
      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: {
            ...state.myListsById[listId],
            totalBooks: state.myListsById[listId].totalBooks + 1,
            firstBookCovers: (() => {
              const covers = state.myListsById[listId].firstBookCovers
                ? [...state.myListsById[listId].firstBookCovers]
                : [];
              if (covers.length < 3 && book.coverImage) {
                covers.push(book.coverImage);
              }
              return covers;
            })(),
          }
        },
        listsById: state.listsById[listId] ? {
          ...state.listsById,
          [listId]: {
            ...state.listsById[listId],
            books: state.listsById[listId].books 
              ? [...state.listsById[listId].books, book]
              : [book],
            totalBooks: (state.listsById[listId].totalBooks || 0) + 1,
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
      await api.delete(`/lists/${listId}/books`, { data: { id: bookId } });
      
      const response = await api.get<Book>(`/books/${bookId}`);
      const book = response.data;
      
      set(state => ({
        myListsById: {
          ...state.myListsById,
          [listId]: {
            ...state.myListsById[listId],
            totalBooks: Math.max(0, state.myListsById[listId].totalBooks - 1),
            firstBookCovers: (() => {
              const covers = state.myListsById[listId].firstBookCovers || [];
              return covers.filter(cover => cover !== book.coverImage);
            })(),
          }
        },
        listsById: state.listsById[listId] ? {
          ...state.listsById,
          [listId]: {
            ...state.listsById[listId],
            books: state.listsById[listId].books 
              ? state.listsById[listId].books.filter(b => b.id !== bookId)
              : [],
            totalBooks: Math.max(0, (state.listsById[listId].totalBooks || 0) - 1),
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
      await api.patch(`/lists/${listId}/reorder`, {
        bookId,
        newPosition,
      });
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
      await api.patch(`/lists/${listId}/reorder-bulk`, {
        bookOrders,
      });
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
    
    await Promise.all(
      myListsIds.map(async (listId) => {
        try {
          const response = await api.get<List>(`/lists/${listId}`);
          const list = response.data;
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
      const response = await api.get<PaginatedResponse<List>>('/lists');
      set({ listsById: response.data.data.reduce<Record<string, List>>((acc: Record<string, List>, list: List) => {
        acc[list.id] = list;
        return acc;
      }, {}), listsIds: response.data.data.map((l: List) => l.id) });
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
      const response = await api.get<List>(`/lists/${id}`);
      const list = response.data;
      set(state => {
        const existingList = state.listsById[id];
        const mergedList = existingList ? {
          ...list,
          firstBookCovers: existingList.firstBookCovers || list.firstBookCovers,
          totalBooks: existingList.totalBooks || list.totalBooks,
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

  updateListImage: async (listId: number, image: ImagePickerAsset) => {
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
        formData.append('image', imagePayload);

        await api.put(`/lists/${listId}/images`, formData, {
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

  isOwner: (listId: number) => {
    const { myListsIds } = get();
    return myListsIds.includes(listId);
  },
})); 