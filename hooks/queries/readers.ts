import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { BookReadersResponse } from '@/types/reader';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';

async function fetchBookReaders(
  bookId: string,
  limit: number = 20
): Promise<BookReadersResponse> {
  const { data } = await api.get<BookReadersResponse>(
    `/books/${bookId}/readers`,
    { params: { limit } }
  );
  return data;
}

/**
 * Hook to fetch users the current user follows who have read a specific book
 * @param bookId - The book ID to get readers for
 * @param limit - Maximum number of readers to fetch (default 20)
 */
export function useBookReaders(
  bookId: string | undefined,
  limit: number = 20
) {
  return useQuery({
    queryKey: bookId ? queryKeys.bookReaders(bookId) : ['book', 'readers', 'disabled'],
    queryFn: () => fetchBookReaders(bookId as string, limit),
    enabled: Boolean(bookId),
    staleTime: staleTimes.content,
  });
}
