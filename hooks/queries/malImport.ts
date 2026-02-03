import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from './keys';

export interface MalImportResponse {
  imported: number;
  notFound: string[];
  skipped: string[];
  alreadyExists: string[];
  details: {
    title: string;
    status: 'imported' | 'not_found' | 'skipped' | 'already_exists';
  }[];
}

async function importFromMal(username: string): Promise<MalImportResponse> {
  const { data } = await api.post<MalImportResponse>('/me/books/import/mal', { username });
  return data;
}

export function useMalImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => importFromMal(username),
    onSuccess: () => {
      // Invalidate library queries to refresh the user's books
      qc.invalidateQueries({ queryKey: queryKeys.userBooks() });
      qc.invalidateQueries({ queryKey: queryKeys.userStats() });
    },
  });
}
