import { create } from 'zustand';
import { getMyLists, getList } from '@/api'; // Added getList
import { ReadingList, ListResponse } from '@/types';

const CACHE_DURATION_LIST_MINUTES = 5; // Renamed for clarity
const CACHE_DURATION_DETAIL_MINUTES = 30;

interface ListsState {
  lists: ReadingList[];
  isLoadingList: boolean; // Renamed
  errorList: string | null; // Renamed
  lastFetchedList: Date | null; // Renamed
  
  detailedLists: Record<string, ReadingList>;
  isLoadingDetail: Record<string, boolean>;
  errorDetail: Record<string, string | null>;
  lastFetchedDetail: Record<string, Date | null>;

  fetchMyLists: (force?: boolean) => Promise<void>;
  fetchListById: (id: string, forceRefresh?: boolean) => Promise<void>; // New action
  clearLists: () => void;
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  isLoadingList: false, // Renamed
  errorList: null, // Renamed
  lastFetchedList: null, // Renamed

  detailedLists: {},
  isLoadingDetail: {},
  errorDetail: {},
  lastFetchedDetail: {},

  fetchMyLists: async (force = false) => {
    const { lists, lastFetchedList } = get(); // Updated to use renamed state

    if (!force && lists.length > 0 && lastFetchedList) {
      const now = new Date();
      const diffMinutes = (now.getTime() - lastFetchedList.getTime()) / (1000 * 60);
      if (diffMinutes < CACHE_DURATION_LIST_MINUTES) { // Updated cache duration constant
        // console.log('Using cached lists.');
        return;
      }
    }

    set({ isLoadingList: true, errorList: null }); // Updated to use renamed state
    try {
      const response: ListResponse = await getMyLists(); 
      set({
        lists: response.items,
        lastFetchedList: new Date(), // Updated to use renamed state
        isLoadingList: false, // Updated to use renamed state
      });
    } catch (err) {
      console.error('Failed to fetch lists:', err);
      set({
        errorList: (err as Error).message || 'Failed to fetch lists', // Updated to use renamed state
        isLoadingList: false, // Updated to use renamed state
      });
    }
  },

  fetchListById: async (id: string, forceRefresh = false) => {
    const { detailedLists, lastFetchedDetail, isLoadingDetail: currentIsLoadingDetail } = get();

    if (currentIsLoadingDetail[id]) {
      return; // Already fetching this list detail
    }

    if (!forceRefresh && detailedLists[id] && lastFetchedDetail[id]) {
      const now = new Date();
      const diffMinutes = (now.getTime() - (lastFetchedDetail[id] as Date).getTime()) / (1000 * 60);
      if (diffMinutes < CACHE_DURATION_DETAIL_MINUTES) {
        // console.log(`Using cached details for list ${id}.`);
        return;
      }
    }

    set((state) => ({
      isLoadingDetail: { ...state.isLoadingDetail, [id]: true },
      errorDetail: { ...state.errorDetail, [id]: null },
    }));

    try {
      const fetchedList = await getList(id); // API getList expects id: string
      set((state) => ({
        detailedLists: { ...state.detailedLists, [id]: fetchedList },
        lastFetchedDetail: { ...state.lastFetchedDetail, [id]: new Date() },
        isLoadingDetail: { ...state.isLoadingDetail, [id]: false },
      }));
    } catch (err) {
      console.error(`Failed to fetch list details for ${id}:`, err);
      set((state) => ({
        errorDetail: { ...state.errorDetail, [id]: (err as Error).message || `Failed to fetch list ${id}` },
        isLoadingDetail: { ...state.isLoadingDetail, [id]: false },
      }));
    }
  },

  clearLists: () => {
    set({
      lists: [],
      isLoadingList: false, // Updated
      errorList: null, // Updated
      lastFetchedList: null, // Updated
      detailedLists: {}, // Added
      isLoadingDetail: {}, // Added
      errorDetail: {}, // Added
      lastFetchedDetail: {}, // Added
    });
  },
}));
