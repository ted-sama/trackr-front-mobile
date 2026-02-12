import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { MalFetchResponse } from './malImport';

// Step 1: Fetch from Mangacollec (no tracking created)
async function fetchFromMangacollec(username: string): Promise<MalFetchResponse> {
  const { data } = await api.post<MalFetchResponse>('/me/books/import/mangacollec/fetch', { username });
  return data;
}

export function useMangacollecFetch() {
  return useMutation({
    mutationFn: (username: string) => fetchFromMangacollec(username),
  });
}
