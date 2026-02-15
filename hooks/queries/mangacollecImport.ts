import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { MalFetchResponse } from './malImport';

export interface ImportJobProgress {
  stage: 'pending' | 'scraping' | 'matching' | 'resolving' | 'completed' | 'failed';
  totalCandidates: number;
  matchedInPass1: number;
  totalToResolve: number;
  resolvedCount: number;
  currentTitle: string | null;
}

interface StartImportResponse {
  jobId: string;
}

interface ImportStatusProcessing {
  status: 'processing';
  progress: ImportJobProgress;
}

interface ImportStatusCompleted {
  status: 'completed';
  progress: ImportJobProgress;
  result: MalFetchResponse;
}

interface ImportStatusFailed {
  status: 'failed';
  error: string;
}

export type ImportStatusResponse = ImportStatusProcessing | ImportStatusCompleted | ImportStatusFailed;

// Mutation: start a new import (POST, returns jobId)
async function startImport(username: string): Promise<StartImportResponse> {
  const { data } = await api.post<StartImportResponse>('/me/books/import/mangacollec/fetch', { username });
  return data;
}

export function useMangacollecStartImport() {
  return useMutation({
    mutationFn: (username: string) => startImport(username),
  });
}
