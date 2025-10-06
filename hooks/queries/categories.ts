import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Category } from '@/types/category';
import { PaginatedResponse } from '@/types/api';
import { Book } from '@/types/book';
import { queryKeys } from './keys';

async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<PaginatedResponse<Category>>('/categories');
  return data.data;
}

async function fetchCategory(id: string): Promise<Category> {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

async function fetchMostTrackedCategory(): Promise<Category> {
  const { data } = await api.get<PaginatedResponse<Book>>('/books?sort=most_tracked');
  const now = new Date();
  return {
    id: 'most-tracked',
    title: 'Most tracked mangas',
    titleFr: 'Mangas les plus suivis',
    description: 'Most tracked mangas',
    descriptionFr: 'Les mangas les plus suivis',
    isFeatured: true,
    createdAt: now,
    updatedAt: now,
    books: data.data,
  };
}

async function fetchTopRatedCategory(): Promise<Category> {
  const { data } = await api.get<PaginatedResponse<Book>>('/books?sort=top_rated');
  const now = new Date();
  return {
    id: 'top-rated',
    title: 'Top rated mangas',
    titleFr: 'Mangas les mieux notés',
    description: 'Top rated mangas',
    descriptionFr: 'Les mangas les mieux notés',
    isFeatured: true,
    createdAt: now,
    updatedAt: now,
    books: data.data,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.category(id) : ['category', 'missing-id'],
    queryFn: () => fetchCategory(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMostTrackedCategory() {
  return useQuery({
    queryKey: queryKeys.mostTracked,
    queryFn: fetchMostTrackedCategory,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTopRatedCategory() {
  return useQuery({
    queryKey: queryKeys.topRated,
    queryFn: fetchTopRatedCategory,
    staleTime: 10 * 60 * 1000,
  });
}


