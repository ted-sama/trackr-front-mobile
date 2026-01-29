import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { BookTracking } from '@/types/reading-status';
import { queryKeys } from './queries/keys';

/**
 * Hook that wraps updateTrackedBook from the store and handles
 * cache invalidation for pinned book and recaps.
 */
export function useUpdateTracking() {
  const queryClient = useQueryClient();
  const { updateTrackedBook } = useTrackedBooksStore();

  const updateTracking = useCallback(
    async (bookId: string | number, tracking: Partial<BookTracking>) => {
      // Update tracking in store
      await updateTrackedBook(bookId, tracking);

      // Invalidate pinned book cache to sync the home screen
      queryClient.invalidateQueries({ queryKey: queryKeys.pinnedBook });

      // If chapter changed, invalidate recap cache for this book
      if (tracking.currentChapter !== undefined) {
        // Invalidate all recaps for this book (any chapter)
        queryClient.invalidateQueries({
          queryKey: ['book', String(bookId), 'recap'],
        });
      }
    },
    [updateTrackedBook, queryClient]
  );

  return { updateTracking };
}
