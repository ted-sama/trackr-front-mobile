import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { BookReview, CreateReviewDTO, UpdateReviewDTO, ReviewSortOption } from '@/types/review';
import { queryKeys } from './keys';

interface BookReviewsResponse {
  reviews: BookReview[];
  total: number;
  hasMore: boolean;
}

// API response format from backend (AdonisJS paginated response)
interface ApiReviewsResponse {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: BookReview[];
}

async function fetchBookReviews(
  bookId: string,
  sort: ReviewSortOption = 'recent',
  limit: number = 10
): Promise<BookReviewsResponse> {
  const { data } = await api.get<ApiReviewsResponse | BookReview[]>(
    `/books/${bookId}/reviews`,
    { params: { sort, limit } }
  );
  
  // Handle array response (simple list)
  if (Array.isArray(data)) {
    return {
      reviews: data,
      total: data.length,
      hasMore: false,
    };
  }
  
  // Handle paginated response from AdonisJS
  if ('meta' in data && 'data' in data) {
    return {
      reviews: data.data,
      total: data.meta.total,
      hasMore: data.meta.nextPageUrl !== null,
    };
  }
  
  // Fallback for other formats
  return {
    reviews: [],
    total: 0,
    hasMore: false,
  };
}

async function createReview(bookId: string, dto: CreateReviewDTO): Promise<BookReview> {
  const { data } = await api.post<BookReview>(`/books/${bookId}/reviews`, dto);
  return data;
}

async function updateReview(bookId: string, reviewId: number, dto: UpdateReviewDTO): Promise<BookReview> {
  const { data } = await api.patch<BookReview>(`/books/${bookId}/reviews/${reviewId}`, dto);
  return data;
}

async function deleteReview(bookId: string, reviewId: number): Promise<void> {
  await api.delete(`/books/${bookId}/reviews/${reviewId}`);
}

async function likeReview(bookId: string, reviewId: number): Promise<void> {
  await api.post(`/books/${bookId}/reviews/${reviewId}/like`);
}

async function unlikeReview(bookId: string, reviewId: number): Promise<void> {
  await api.delete(`/books/${bookId}/reviews/${reviewId}/like`);
}

export function useBookReviews(
  bookId: string | undefined,
  sort: ReviewSortOption = 'recent',
  limit: number = 10
) {
  return useQuery({
    queryKey: bookId ? queryKeys.bookReviews(bookId, sort) : ['book', 'reviews', 'disabled'],
    queryFn: () => fetchBookReviews(bookId as string, sort, limit),
    enabled: Boolean(bookId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateReview(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateReviewDTO) => createReview(bookId, dto),
    onSuccess: () => {
      // Invalidate all review queries for this book (any sort order)
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookReviewsBase(bookId),
        refetchType: 'all',
      });
      // Invalidate user's own review query
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBookReview(bookId),
      });
    },
  });
}

export function useUpdateReview(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, dto }: { reviewId: number; dto: UpdateReviewDTO }) =>
      updateReview(bookId, reviewId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookReviewsBase(bookId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBookReview(bookId),
      });
    },
  });
}

export function useDeleteReview(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => deleteReview(bookId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookReviewsBase(bookId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBookReview(bookId),
      });
    },
  });
}

export function useToggleReviewLike(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, isLiked }: { reviewId: number; isLiked: boolean }) =>
      isLiked ? unlikeReview(bookId, reviewId) : likeReview(bookId, reviewId),
    onMutate: async ({ reviewId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.bookReviewsBase(bookId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.review(bookId, reviewId.toString()) });

      // Snapshot the previous values
      const previousReviews = queryClient.getQueriesData({ queryKey: queryKeys.bookReviewsBase(bookId) });
      const previousReview = queryClient.getQueryData<BookReview>(queryKeys.review(bookId, reviewId.toString()));

      // Optimistically update all review queries for this book
      queryClient.setQueriesData(
        { queryKey: queryKeys.bookReviewsBase(bookId) },
        (old: BookReviewsResponse | undefined) => {
          if (!old) return old;

          return {
            ...old,
            reviews: old.reviews.map((review) =>
              review.id === reviewId
                ? {
                    ...review,
                    isLikedByMe: !isLiked,
                    likesCount: isLiked ? review.likesCount - 1 : review.likesCount + 1,
                  }
                : review
            ),
          };
        }
      );

      // Optimistically update the single review query (for detail page)
      if (previousReview) {
        queryClient.setQueryData<BookReview>(
          queryKeys.review(bookId, reviewId.toString()),
          {
            ...previousReview,
            isLikedByMe: !isLiked,
            likesCount: isLiked ? previousReview.likesCount - 1 : previousReview.likesCount + 1,
          }
        );
      }

      return { previousReviews, previousReview };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousReviews) {
        context.previousReviews.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousReview) {
        queryClient.setQueryData(
          queryKeys.review(bookId, variables.reviewId.toString()),
          context.previousReview
        );
      }
    },
  });
}

// Hook to get the current user's review for a book (if exists)
async function fetchMyReview(bookId: string): Promise<BookReview | null> {
  const { data } = await api.get<BookReview | null>(`/books/${bookId}/reviews/me`);
  return data;
}

export function useMyBookReview(bookId: string | undefined) {
  return useQuery({
    queryKey: bookId ? queryKeys.myBookReview(bookId) : ['my-review', 'disabled'],
    queryFn: () => fetchMyReview(bookId as string),
    enabled: Boolean(bookId),
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch a single review with revisions
async function fetchReview(bookId: string, reviewId: string): Promise<BookReview> {
  const { data } = await api.get<BookReview>(`/books/${bookId}/reviews/${reviewId}`);
  return data;
}

// Hook to get a single review with revisions
export function useReview(bookId: string | undefined, reviewId: string | undefined) {
  return useQuery({
    queryKey: bookId && reviewId ? queryKeys.review(bookId, reviewId) : ['review', 'disabled'],
    queryFn: () => fetchReview(bookId as string, reviewId as string),
    enabled: Boolean(bookId) && Boolean(reviewId),
    staleTime: 2 * 60 * 1000,
  });
}

