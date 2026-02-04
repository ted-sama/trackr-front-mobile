import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from './keys';

// Pending book from MAL (not yet imported)
export interface PendingImportBook {
  bookId: number;
  malId: number;
  title: string;
  coverImage: string | null;
  status: string;
  currentChapter: number | null;
  currentVolume: number | null;
  rating: number | null;
  startDate: string | null;
  finishDate: string | null;
  notes: string | null;
}

// Response from fetch endpoint
export interface MalFetchResponse {
  success: boolean;
  message: string;
  pendingBooks: PendingImportBook[];
  notFound: number;
  skipped: number;
  alreadyExists: number;
  errors: string[];
  details: {
    notFound: string[];
    skipped: string[];
    alreadyExists: string[];
  };
}

// Response from confirm endpoint
export interface MalConfirmResponse {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

// Step 1: Fetch from MAL (no tracking created)
async function fetchFromMal(username: string): Promise<MalFetchResponse> {
  const { data } = await api.post<MalFetchResponse>('/me/books/import/mal/fetch', { username });
  return data;
}

// Step 2: Confirm import of selected books
async function confirmMalImport(books: PendingImportBook[]): Promise<MalConfirmResponse> {
  const { data } = await api.post<MalConfirmResponse>('/me/books/import/mal/confirm', { books });
  return data;
}

export function useMalFetch() {
  return useMutation({
    mutationFn: (username: string) => fetchFromMal(username),
  });
}

export function useMalConfirmImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (books: PendingImportBook[]) => confirmMalImport(books),
    onSuccess: () => {
      // Invalidate library queries to refresh the user's books
      qc.invalidateQueries({ queryKey: queryKeys.userBooks() });
      qc.invalidateQueries({ queryKey: queryKeys.userStats() });
    },
  });
}
