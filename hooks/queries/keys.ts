export const queryKeys = {
  user: (userId: string) => ['user', userId] as const,

  book: (id: string) => ['book', id] as const,
  bookRecap: (id: string, chapter: number) => ['book', id, 'recap', chapter] as const,
  sameAuthorCategory: (id: string) => ['book', id, 'same-author'] as const,

  categories: ['categories'] as const,
  category: (id: string) => ['category', id] as const,
  mostTracked: ['home', 'most-tracked'] as const,
  topRated: ['home', 'top-rated'] as const,

  lists: ['lists'] as const,
  myListsBase: ['my-lists'] as const,
  myLists: (q?: string) => ['my-lists', q ?? ''] as const,
  list: (id: string) => ['list', id] as const,
  userLists: (userId?: string) => ['user', 'lists', userId ?? 'me'] as const,
  userCreatedLists: (username?: string) => ['user', 'created-lists', username ?? 'me'] as const,

  userStats: (username?: string) => ['user', 'stats', username ?? 'me'] as const,
  userBooks: (username?: string) => ['user', 'books', username ?? 'me'] as const,

  search: (scope: 'books' | 'lists' | 'users', q: string, types?: string[]) => 
    types ? ['search', scope, q, types] as const : ['search', scope, q] as const,
};


