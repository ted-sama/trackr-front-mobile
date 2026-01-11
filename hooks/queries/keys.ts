export const queryKeys = {
  user: (userId: string) => ['user', userId] as const,

  book: (id: string) => ['book', id] as const,
  popularBooks: ['books', 'popular'] as const,
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

  // Reports
  myReports: ['reports', 'my'] as const,

  // Reviews
  bookReviewsBase: (bookId: string) => ['book', bookId, 'reviews'] as const,
  bookReviews: (bookId: string, sort?: string) =>
    sort ? ['book', bookId, 'reviews', sort] as const : ['book', bookId, 'reviews'] as const,
  myBookReview: (bookId: string) => ['book', bookId, 'reviews', 'me'] as const,
  review: (bookId: string, reviewId: string) => ['book', bookId, 'review', reviewId] as const,
  userReviews: (username: string) => ['user', username, 'reviews'] as const,

  // Subscription & Chat
  subscription: ['subscription'] as const,
  chatUsage: ['chat-usage'] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationsUnreadCount: ['notifications', 'unread-count'] as const,
  notificationSettings: ['notifications', 'settings'] as const,

  // Genres
  genreTranslations: ['genres', 'translations'] as const,

  // Follow system
  userFollowers: (username: string) => ['user', username, 'followers'] as const,
  userFollowing: (username: string) => ['user', username, 'following'] as const,
  myFollowers: ['me', 'followers'] as const,
  myFollowing: ['me', 'following'] as const,

  // Feed
  feedPopularAmongFollowing: ['feed', 'popular-among-following'] as const,
  feedRecentlyRated: ['feed', 'recently-rated'] as const,
};


