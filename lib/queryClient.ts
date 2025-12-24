import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  QueryClient,
  focusManager,
  onlineManager,
  QueryKey,
} from '@tanstack/react-query';

// ============================================================================
// STALE TIME CONFIGURATIONS
// Categorize queries by data freshness requirements
// ============================================================================

export const staleTimes = {
  /** Real-time data that should always be fresh (subscription, chat usage) */
  realtime: 30 * 1000, // 30 seconds

  /** User-specific data that changes frequently (activity, stats) */
  user: 60 * 1000, // 1 minute

  /** Content that updates moderately (lists, reviews) */
  content: 2 * 60 * 1000, // 2 minutes

  /** Reference data that rarely changes (books, categories) */
  reference: 5 * 60 * 1000, // 5 minutes

  /** Static data (categories list, search results) */
  static: 10 * 60 * 1000, // 10 minutes
} as const;

export const gcTimes = {
  /** Keep in memory briefly */
  short: 5 * 60 * 1000, // 5 minutes

  /** Standard cache duration */
  standard: 15 * 60 * 1000, // 15 minutes

  /** Long-lived cache for reference data */
  long: 30 * 60 * 1000, // 30 minutes
} as const;

// ============================================================================
// QUERY PRIORITY CONFIGURATION
// Define which queries to refetch on foreground based on priority
// ============================================================================

type QueryPriority = 'critical' | 'high' | 'normal' | 'low';

interface QueryPriorityConfig {
  /** Query key prefixes for this priority level */
  prefixes: string[];
  /** Whether to refetch on app foreground */
  refetchOnForeground: boolean;
  /** Minimum time in background before refetching (ms) */
  minBackgroundTime: number;
}

const queryPriorities: Record<QueryPriority, QueryPriorityConfig> = {
  critical: {
    // Always refetch immediately on foreground
    prefixes: ['subscription', 'chat-usage', 'user'],
    refetchOnForeground: true,
    minBackgroundTime: 0,
  },
  high: {
    // Refetch after 30s in background
    prefixes: ['my-lists', 'library', 'user'],
    refetchOnForeground: true,
    minBackgroundTime: 30 * 1000,
  },
  normal: {
    // Refetch after 2min in background
    prefixes: ['book', 'list', 'reviews'],
    refetchOnForeground: true,
    minBackgroundTime: 2 * 60 * 1000,
  },
  low: {
    // Only refetch after 5min in background
    prefixes: ['categories', 'search', 'home'],
    refetchOnForeground: true,
    minBackgroundTime: 5 * 60 * 1000,
  },
};

// ============================================================================
// QUERY CLIENT CONFIGURATION
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: staleTimes.content,
      gcTime: gcTimes.standard,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (except 408 timeout, 429 rate limit)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (error.response.status !== 408 && error.response.status !== 429) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      // Network mode: always try to fetch, let error handling deal with offline
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      networkMode: 'offlineFirst',
    },
  },
});

// ============================================================================
// ONLINE MANAGER (Network Connectivity)
// ============================================================================

// Set up network connectivity detection
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    setOnline(isOnline);
  });
});

// ============================================================================
// FOCUS MANAGER (App State / Foreground Detection)
// ============================================================================

let lastBackgroundTime: number | null = null;
let appState: AppStateStatus = AppState.currentState;

/**
 * Get the priority level for a query key
 */
function getQueryPriority(queryKey: QueryKey): QueryPriority {
  const keyString = Array.isArray(queryKey) ? queryKey[0] : queryKey;

  for (const [priority, config] of Object.entries(queryPriorities) as [QueryPriority, QueryPriorityConfig][]) {
    if (config.prefixes.some((prefix) => String(keyString).startsWith(prefix))) {
      return priority;
    }
  }

  return 'normal';
}

/**
 * Check if a query should be refetched based on its priority and background time
 */
function shouldRefetchQuery(queryKey: QueryKey, backgroundDuration: number): boolean {
  const priority = getQueryPriority(queryKey);
  const config = queryPriorities[priority];

  return config.refetchOnForeground && backgroundDuration >= config.minBackgroundTime;
}

/**
 * Intelligently refetch queries based on priority when app comes to foreground
 */
async function handleForegroundRefetch() {
  if (lastBackgroundTime === null) return;

  const backgroundDuration = Date.now() - lastBackgroundTime;
  lastBackgroundTime = null;

  // Get all active queries
  const queries = queryClient.getQueryCache().getAll();
  const activeQueries = queries.filter((query) => {
    // Only refetch active queries (those with observers)
    return query.getObserversCount() > 0;
  });

  // Group queries by priority for batch refetching
  const queriesToRefetch: QueryKey[] = [];

  for (const query of activeQueries) {
    if (shouldRefetchQuery(query.queryKey, backgroundDuration)) {
      queriesToRefetch.push(query.queryKey);
    }
  }

  // Refetch queries in priority order (critical first)
  if (queriesToRefetch.length > 0) {
    // Invalidate stale queries - this will trigger refetch for active ones
    for (const queryKey of queriesToRefetch) {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      });
    }
  }
}

/**
 * Handle app state changes
 */
function onAppStateChange(nextState: AppStateStatus) {
  const prevState = appState;
  appState = nextState;

  if (nextState === 'active') {
    // App came to foreground
    focusManager.setFocused(true);

    // Perform intelligent refetch if we were in background
    if (prevState === 'background' || prevState === 'inactive') {
      handleForegroundRefetch();
    }
  } else if (nextState === 'background') {
    // App went to background - record the time
    lastBackgroundTime = Date.now();
    focusManager.setFocused(false);
  } else if (nextState === 'inactive') {
    // iOS: app is transitioning (not fully backgrounded yet)
    // Don't change focus state for brief transitions
  }
}

// Subscribe to app state changes
const appStateSubscription = AppState.addEventListener('change', onAppStateChange);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Manually trigger a foreground refetch (useful for pull-to-refresh scenarios)
 */
export function triggerForegroundRefetch() {
  lastBackgroundTime = Date.now() - 5 * 60 * 1000; // Simulate 5min background
  handleForegroundRefetch();
}

/**
 * Check if the app is currently online
 */
export function isOnline(): boolean {
  return onlineManager.isOnline();
}

/**
 * Force all active queries to refetch
 */
export function refetchAllActiveQueries() {
  queryClient.invalidateQueries({
    refetchType: 'active',
  });
}

/**
 * Cleanup function (call on app unmount if needed)
 */
export function cleanup() {
  appStateSubscription.remove();
}
