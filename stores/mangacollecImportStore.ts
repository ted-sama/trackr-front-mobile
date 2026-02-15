import { create } from 'zustand';
import { api } from '@/services/api';
import type { MalFetchResponse } from '@/hooks/queries/malImport';
import type { ImportJobProgress } from '@/hooks/queries/mangacollecImport';

export type ImportStoreStatus = 'idle' | 'processing' | 'completed' | 'failed';

interface MangacollecImportState {
  jobId: string | null;
  status: ImportStoreStatus;
  progress: ImportJobProgress | null;
  result: MalFetchResponse | null;
  error: string | null;

  startJob: (jobId: string) => void;
  setProcessing: (progress: ImportJobProgress) => void;
  setCompleted: (result: MalFetchResponse) => void;
  setFailed: (error: string) => void;
  clear: () => void;
}

/** Fire-and-forget: tell the server to remove the job so /active won't return it again */
function dismissJobOnServer() {
  api.delete('/me/books/import/mangacollec/dismiss').catch(() => {
    // Not critical — job will auto-expire after 30 min anyway
  });
}

export const useMangacollecImportStore = create<MangacollecImportState>()((set) => ({
  jobId: null,
  status: 'idle',
  progress: null,
  result: null,
  error: null,

  startJob: (jobId) =>
    set({
      jobId,
      status: 'processing',
      progress: null,
      result: null,
      error: null,
    }),

  setProcessing: (progress) =>
    set({ status: 'processing', progress }),

  setCompleted: (result) =>
    set({ status: 'completed', result, progress: null }),

  setFailed: (error) =>
    set({ status: 'failed', error, progress: null }),

  clear: () => {
    dismissJobOnServer();
    set({
      jobId: null,
      status: 'idle',
      progress: null,
      result: null,
      error: null,
    });
  },
}));
