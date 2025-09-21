import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PaginatedResponse } from '@/types/api';
import { Book } from '@/types/book';
import { List } from '@/types/list';
import { queryKeys } from './keys';

type Scope = 'books' | 'lists';

async function fetchSearch(scope: Scope, q: string, page: number): Promise<PaginatedResponse<Book | List>> {
  const endpoint = scope === 'books' ? '/books/search' : '/lists/search';
  const { data } = await api.get<PaginatedResponse<Book | List>>(endpoint, {
    params: { q, page, limit: 20 },
  });
  return data;
}

export function useSearch(scope: Scope, q: string) {
  const enabled = Boolean(q && q.trim().length > 0);
  return useInfiniteQuery({
    queryKey: queryKeys.search(scope, q.trim()),
    queryFn: ({ pageParam }) => fetchSearch(scope, q.trim(), pageParam ?? 1),
    getNextPageParam: (lastPage) => {
      const { currentPage, lastPage: last } = lastPage.meta;
      return currentPage < last ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
  });
}


