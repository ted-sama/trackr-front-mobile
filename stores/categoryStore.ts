import { create } from 'zustand';
import { api } from '@/services/api';
import { Category } from '@/types/category';
import { PaginatedResponse } from '@/types/api';

export interface CategoryState {
  categoriesById: Record<string, Category>;
  allIds: string[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categoriesById: {},
  allIds: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Category>>('/categories');
      const categories = response.data.data;
      set({
        categoriesById: categories.reduce<Record<string, Category>>((acc, cat) => {
          acc[cat.id] = cat;
          return acc;
        }, {}),
        allIds: categories.map(cat => cat.id),
      });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Category>(`/categories/${id}`);
      const cat = response.data;
      set(state => ({
        categoriesById: { ...state.categoriesById, [id]: cat },
      }));
      if (!get().allIds.includes(id)) {
        set(state => ({ allIds: [...state.allIds, id] }));
      }
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
})); 