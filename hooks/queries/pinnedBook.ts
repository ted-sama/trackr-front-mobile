import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';
import { toast } from 'sonner-native';

export interface PinnedBook {
  id: number;
  bookId: number;
  summary: string | null;
  book: {
    id: number;
    title: string;
    coverImage: string | null;
    authors: { id: number; name: string }[];
    publishers: { id: number; name: string }[];
    totalChapters: number | null;
    type: string | null;
    dominantColor: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';
  currentChapter: number | null;
  currentVolume: number | null;
  lastReadAt: string | null;
  totalChapters: number | null;
  progressPercentage: number | null;
}

export interface PinnedBookWithProgress {
  pinnedBook: PinnedBook;
  progress: ReadingProgress | null;
}

/**
 * Hook to fetch the current user's pinned book
 */
export function usePinnedBook() {
  return useQuery({
    queryKey: queryKeys.pinnedBook,
    queryFn: async () => {
      const { data } = await api.get<{ pinnedBook: PinnedBook | null }>('/me/pinned-book');
      return data.pinnedBook;
    },
    staleTime: staleTimes.realtime,
  });
}

/**
 * Hook to fetch pinned book with reading progress
 */
export function usePinnedBookWithProgress() {
  return useQuery({
    queryKey: queryKeys.pinnedBookWithProgress,
    queryFn: async () => {
      const { data } = await api.get<{ pinnedBook: PinnedBook | null; progress: ReadingProgress | null }>(
        '/me/pinned-book/with-progress'
      );
      return data;
    },
    staleTime: staleTimes.realtime,
  });
}

/**
 * Hook to pin a book (Trackr Plus only)
 */
export function usePinBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: number) => {
      const { data } = await api.post<{ pinnedBook: PinnedBook }>('/me/pinned-book', { bookId });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.pinnedBook, data.pinnedBook);
      queryClient.setQueryData(queryKeys.pinnedBookWithProgress, { pinnedBook: data.pinnedBook, progress: null });
      toast.success('Book pinned successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to pin book';
      toast.error(message);
    },
  });
}

/**
 * Hook to update pinned book (e.g., add AI summary)
 */
export function useUpdatePinnedBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (summary: string) => {
      const { data } = await api.patch<{ pinnedBook: PinnedBook }>('/me/pinned-book', { summary });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.pinnedBook, data.pinnedBook);
      toast.success('Pinned book updated!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update pinned book';
      toast.error(message);
    },
  });
}

/**
 * Hook to remove pinned book
 */
export function useUnpinBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete('/me/pinned-book');
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.pinnedBook, null);
      queryClient.setQueryData(queryKeys.pinnedBookWithProgress, { pinnedBook: null, progress: null });
      toast.success('Book unpinned');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to unpin book';
      toast.error(message);
    },
  });
}
