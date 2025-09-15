import { create } from 'zustand';
import { api } from '@/services/api';
import { Category } from '@/types/category';
import { Book } from '@/types/book';
import { PaginatedResponse } from '@/types/api';

export interface CategoryState {
  categoriesById: Record<string, Category>;
  homeSections: Record<string, Category>;
  allIds: string[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategory: (id: string) => Promise<void>;
  fetchMostTracked: () => Promise<void>;
  fetchTopRated: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categoriesById: {},
  homeSections: {},
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

  fetchMostTracked: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Book>>('/books?sort=most_tracked');
      const books: Book[] = response.data.data;
      const mostTracked: Category = {
        id: 'most-tracked',
        title: 'Mangas les plus suivis',
        description: 'Les mangas les plus suivis',
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        books: books,
      }
      set(state => ({ homeSections: { ...state.homeSections, 'most-tracked': mostTracked } }));
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTopRated: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Book>>('/books?sort=top_rated');
      const books: Book[] = response.data.data;
      const topRated: Category = {
        id: 'top-rated',
        title: 'Mangas les mieux notés',
        description: 'Les mangas les mieux notés',
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        books: books,
      }
      set(state => ({ homeSections: { ...state.homeSections, 'top-rated': topRated } }));
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  }
})); 