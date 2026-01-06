import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Book } from '@/types/book';
import { Category } from '@/types/category';
import { PaginatedResponse } from '@/types/api';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';

async function fetchBook(id: string): Promise<Book> {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
}

async function fetchBooksBySameAuthorCategory(bookId: string): Promise<Category> {
  const { data } = await api.get<Book[]>(`/books/${bookId}/same`);
  const now = new Date();
  return {
    id: bookId,
    title: "Other books by the same author",
    titleFr: "Autres livres de l'auteur",
    description: 'Other books by the same author',
    descriptionFr: 'Autres livres de l\'auteur',
    isFeatured: false,
    books: data,
    createdAt: now,
    updatedAt: now,
  };
}

async function fetchRecap(bookId: string, chapter: number): Promise<string> {
  const { data } = await api.get<string>(`/books/${bookId}/recap/${chapter}`);
  return data;
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.book(id) : ['book', 'missing-id'],
    queryFn: () => fetchBook(id as string),
    enabled: Boolean(id),
    staleTime: staleTimes.reference,
  });
}

export function useBooksBySameAuthorCategory(bookId: string | undefined) {
  return useQuery({
    queryKey: bookId ? queryKeys.sameAuthorCategory(bookId) : ['book', 'missing-id', 'same-author'],
    queryFn: () => fetchBooksBySameAuthorCategory(bookId as string),
    enabled: Boolean(bookId),
    staleTime: staleTimes.reference,
  });
}

export function useBookRecap(bookId: string | undefined, chapter: number | undefined) {
  const enabled = Boolean(bookId) && typeof chapter === 'number' && chapter > 0;
  return useQuery({
    queryKey: enabled ? queryKeys.bookRecap(bookId as string, chapter as number) : ['book', 'recap', 'disabled'],
    queryFn: () => fetchRecap(bookId as string, chapter as number),
    enabled,
  });
}

const POPULAR_BOOKS_LIMIT = 20;
const POPULAR_BOOKS_MAX = 100;

async function fetchPopularBooks(page: number): Promise<PaginatedResponse<Book>> {
  const { data } = await api.get<PaginatedResponse<Book>>('/books/popular', {
    params: {
      page,
      limit: POPULAR_BOOKS_LIMIT,
    },
  });
  return data;
}

export function usePopularBooks() {
  return useInfiniteQuery({
    queryKey: queryKeys.popularBooks,
    queryFn: ({ pageParam }) => fetchPopularBooks(pageParam),
    getNextPageParam: (lastPage) => {
      const { currentPage, lastPage: lastPageNum } = lastPage.meta;
      // Stop at 100 books (5 pages of 20)
      const maxPage = Math.ceil(POPULAR_BOOKS_MAX / POPULAR_BOOKS_LIMIT);
      if (currentPage < lastPageNum && currentPage < maxPage) {
        return currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: staleTimes.content,
  });
}
