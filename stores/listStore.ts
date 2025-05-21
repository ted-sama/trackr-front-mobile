import { create } from 'zustand';
import { getMyLists, getList } from '@/api';
import { ReadingList } from '@/types';

export interface ListState {
  myListsById: Record<string, ReadingList>;
  myListsIds: string[];
  readingListsById: Record<string, ReadingList>;
  isLoading: boolean;
  error: string | null;
  fetchMyLists: () => Promise<void>;
  fetchList: (id: string) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  myListsById: {},
  myListsIds: [],
  readingListsById: {},
  isLoading: false,
  error: null,

  fetchMyLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMyLists();
      const lists = response.items;
      const byId = lists.reduce<Record<string, ReadingList>>((acc, list) => {
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