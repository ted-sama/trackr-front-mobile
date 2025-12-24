import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PaginatedResponse } from '@/types/api';
import { Book } from '@/types/book';
import { List } from '@/types/list';
import { User } from '@/types/user';
import { queryKeys } from './keys';
import { useUIStore, BookType, ALL_BOOK_TYPES } from '@/stores/uiStore';
import { staleTimes } from '@/lib/queryClient';

type Scope = 'books' | 'lists' | 'users';

async function fetchSearch(
  scope: Scope,
  q: string,
  page: number,
  types?: BookType[]
): Promise<PaginatedResponse<Book | List | User>> {
  const endpoint = scope === 'books' ? '/books/search' : scope === 'lists' ? '/lists/search' : '/users/search';
  
  // Build params
  const params: Record<string, unknown> = { q, page, limit: 20 };
  
  // Add types filter only for books scope and if not all types are selected
  if (scope === 'books' && types && types.length > 0 && types.length < ALL_BOOK_TYPES.length) {
    params.types = types.join(',');
  }
  
  const { data } = await api.get<PaginatedResponse<Book | List | User>>(endpoint, { params });
  return data;
}

export function useSearch(scope: Scope, q: string) {
  const searchTypes = useUIStore((state) => state.searchTypes);
  const enabled = Boolean(q && q.trim().length > 0);
  
  return useInfiniteQuery({
    queryKey: queryKeys.search(scope, q.trim(), scope === 'books' ? searchTypes : undefined),
    queryFn: ({ pageParam }) => fetchSearch(scope, q.trim(), pageParam ?? 1, scope === 'books' ? searchTypes : undefined),
    getNextPageParam: (lastPage) => {
      const { currentPage, lastPage: last } = lastPage.meta;
      return currentPage < last ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: staleTimes.static,
  });
}


