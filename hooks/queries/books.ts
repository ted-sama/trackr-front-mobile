import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Book } from '@/types/book';
import { Category } from '@/types/category';
import { queryKeys } from './keys';

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
  });
}

export function useBooksBySameAuthorCategory(bookId: string | undefined) {
  return useQuery({
    queryKey: bookId ? queryKeys.sameAuthorCategory(bookId) : ['book', 'missing-id', 'same-author'],
    queryFn: () => fetchBooksBySameAuthorCategory(bookId as string),
    enabled: Boolean(bookId),
    staleTime: 5 * 60 * 1000,
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


