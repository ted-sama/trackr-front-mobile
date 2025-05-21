import { create } from 'zustand';
import { getCategories as apiGetCategories, getCategory as apiGetCategory } from '@/api'; // Renamed for clarity
import { Category, CategoryResponse } from '@/types'; // Assuming CategoryResponse is used by apiGetCategories

const CACHE_DURATION_LIST_HOURS = 1;
const CACHE_DURATION_DETAIL_MINUTES = 30;

interface CategoriesState {
  categories: Category[];
  detailedCategories: Record<string, Category>;
  isLoadingList: boolean;
  isLoadingDetail: Record<string, boolean>;
  errorList: string | null;
  errorDetail: Record<string, string | null>;
  lastFetchedList: Date | null;
  lastFetchedDetail: Record<string, Date | null>;

  fetchAllCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchCategoryById: (id: string, forceRefresh?: boolean) => Promise<void>;
  clearAllCategoriesData: () => void;

  // Optional selectors
  getCategoryFromList: (id: string) => Category | undefined;
  getDetailedCategory: (id: string) => Category | undefined;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  detailedCategories: {},
  isLoadingList: false,
  isLoadingDetail: {},
  errorList: null,
  errorDetail: {},
  lastFetchedList: null,
  lastFetchedDetail: {},

  fetchAllCategories: async (forceRefresh = false) => {
    const { categories: currentCategories, lastFetchedList } = get();

    if (!forceRefresh && currentCategories.length > 0 && lastFetchedList) {
      const now = new Date();
      const diffHours = (now.getTime() - lastFetchedList.getTime()) / (1000 * 60 * 60);
      if (diffHours < CACHE_DURATION_LIST_HOURS) {
        // console.log('Using cached categories list.');
        return;
      }
    }

    set({ isLoadingList: true, errorList: null });
    try {
      // apiGetCategories is expected to return CategoryResponse which has an 'items' array
      const response: CategoryResponse = await apiGetCategories();
      set({
        categories: response.items,
        lastFetchedList: new Date(),
        isLoadingList: false,
      });
    } catch (err) {
      console.error('Failed to fetch categories list:', err);
      set({
        errorList: (err as Error).message || 'Failed to fetch categories list',
        isLoadingList: false,
      });
    }
  },

  fetchCategoryById: async (id: string, forceRefresh = false) => {
    const { detailedCategories, lastFetchedDetail, isLoadingDetail: currentIsLoadingDetail } = get();

    if (currentIsLoadingDetail[id]) {
      return; // Already fetching this category detail
    }

    if (!forceRefresh && detailedCategories[id] && lastFetchedDetail[id]) {
      const now = new Date();
      const diffMinutes = (now.getTime() - (lastFetchedDetail[id] as Date).getTime()) / (1000 * 60);
      if (diffMinutes < CACHE_DURATION_DETAIL_MINUTES) {
        // console.log(`Using cached details for category ${id}.`);
        return;
      }
    }

    set((state) => ({
      isLoadingDetail: { ...state.isLoadingDetail, [id]: true },
      errorDetail: { ...state.errorDetail, [id]: null },
    }));

    try {
      const fetchedCategory = await apiGetCategory(id); // apiGetCategory expects id: string
      set((state) => ({
        detailedCategories: { ...state.detailedCategories, [id]: fetchedCategory },
        lastFetchedDetail: { ...state.lastFetchedDetail, [id]: new Date() },
        isLoadingDetail: { ...state.isLoadingDetail, [id]: false },
      }));
    } catch (err) {
      console.error(`Failed to fetch category details for ${id}:`, err);
      set((state) => ({
        errorDetail: { ...state.errorDetail, [id]: (err as Error).message || `Failed to fetch category ${id}` },
        isLoadingDetail: { ...state.isLoadingDetail, [id]: false },
      }));
    }
  },

  clearAllCategoriesData: () => {
    set({
      categories: [],
      detailedCategories: {},
      isLoadingList: false,
      isLoadingDetail: {},
      errorList: null,
      errorDetail: {},
      lastFetchedList: null,
      lastFetchedDetail: {},
    });
  },

  // Selectors
  getCategoryFromList: (id: string) => {
    return get().categories.find(category => category.id === id);
  },
  getDetailedCategory: (id: string) => {
    return get().detailedCategories[id];
  },
}));
