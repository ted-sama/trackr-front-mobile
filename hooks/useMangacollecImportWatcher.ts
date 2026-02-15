import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMangacollecImportStore } from '@/stores/mangacollecImportStore';
import type { ImportStatusResponse } from '@/hooks/queries/mangacollecImport';
import type { MalFetchResponse } from '@/hooks/queries/malImport';

const POLL_INTERVAL_MS = 3000;

/**
 * Global watcher that runs in the root layout.
 * - On mount (when authenticated): checks for an active import job on the server
 * - When a jobId is in the store: polls every 3s for status updates
 * - On completion/failure: updates the store and shows a toast
 */
export function useMangacollecImportWatcher() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const jobId = useMangacollecImportStore((s) => s.jobId);
  const status = useMangacollecImportStore((s) => s.status);
  const startJob = useMangacollecImportStore((s) => s.startJob);
  const setProcessing = useMangacollecImportStore((s) => s.setProcessing);
  const setCompleted = useMangacollecImportStore((s) => s.setCompleted);
  const setFailed = useMangacollecImportStore((s) => s.setFailed);

  // On mount: check for existing active import
  useEffect(() => {
    if (!isAuthenticated || jobId || status !== 'idle') return;

    checkActiveImport();
  }, [isAuthenticated]);

  // Poll when there's an active job
  useEffect(() => {
    if (!jobId || status !== 'processing') {
      clearPolling();
      return;
    }

    // Start polling immediately then at interval
    pollStatus(jobId);
    intervalRef.current = setInterval(() => pollStatus(jobId), POLL_INTERVAL_MS);

    return () => clearPolling();
  }, [jobId, status]);

  // Pause/resume polling when app goes to background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const currentJobId = useMangacollecImportStore.getState().jobId;
      const currentStatus = useMangacollecImportStore.getState().status;

      if (nextState === 'active' && currentJobId && currentStatus === 'processing') {
        clearPolling();
        pollStatus(currentJobId);
        intervalRef.current = setInterval(() => pollStatus(currentJobId), POLL_INTERVAL_MS);
      } else if (nextState !== 'active') {
        clearPolling();
      }
    });

    return () => subscription.remove();
  }, []);

  function clearPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function checkActiveImport() {
    try {
      const response = await api.get('/me/books/import/mangacollec/active', {
        validateStatus: (s) => s === 200 || s === 204,
      });

      if (response.status === 204 || !response.data) return;

      const data = response.data as {
        jobId: string;
        status: string;
        progress?: any;
        result?: MalFetchResponse;
        error?: string;
      };

      if (data.status === 'completed' && data.result) {
        useMangacollecImportStore.getState().startJob(data.jobId);
        setCompleted(data.result);
        notifyCompletion(data.result);
      } else if (data.status === 'processing') {
        startJob(data.jobId);
      }
    } catch {
      // Silently ignore — not critical
    }
  }

  async function pollStatus(id: string) {
    try {
      const { data } = await api.get<ImportStatusResponse>(
        `/me/books/import/mangacollec/status/${id}`
      );

      if (data.status === 'processing') {
        setProcessing(data.progress);
      } else if (data.status === 'completed') {
        clearPolling();
        setCompleted(data.result);
        notifyCompletion(data.result);
      } else if (data.status === 'failed') {
        clearPolling();
        setFailed(data.error);
        notifyFailure();
      }
    } catch {
      // Network error — keep polling, don't fail
    }
  }

  function notifyCompletion(result: MalFetchResponse) {
    const count = result.pendingBooks?.length ?? 0;

    if (count > 0) {
      toast.success(t('mangacollecImport.notifications.completionToast', { count }), {
        duration: 6000,
        action: {
          label: t('mangacollecImport.notifications.completionAction'),
          onClick: () => router.push('/(zShared)/mangacollec-import'),
        },
        actionButtonStyle: {
          backgroundColor: colors.accent,
          borderRadius: 10,
          borderWidth: 0,
          paddingVertical: 10,
          paddingHorizontal: 16,
          width: '100%',
        },
        actionButtonTextStyle: {
          color: '#fff',
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 14,
          textAlign: 'center',
          alignSelf: 'center',
        },
      });
    } else {
      toast(t('mangacollecImport.notifications.completionToastEmpty'), { duration: 4000 });
    }
  }

  function notifyFailure() {
    toast.error(t('mangacollecImport.notifications.failureToast'), { duration: 5000 });
  }
}
