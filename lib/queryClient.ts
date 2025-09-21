import { AppState, AppStateStatus } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';

// Bridge React Native AppState to React Query focus manager
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: false,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Subscribe once in module scope
AppState.addEventListener('change', onAppStateChange);


