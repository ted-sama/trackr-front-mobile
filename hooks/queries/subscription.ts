import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from './keys';

export interface ChatLimits {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string | null;
}

export interface SubscriptionInfo {
  plan: 'free' | 'plus';
  isPremium: boolean;
  subscription: {
    status: string | null;
    expiresAt: string | null;
    period: 'monthly' | 'yearly' | null;
  };
  chat: ChatLimits;
  features: {
    gifAvatar: boolean;
    imageBackdrop: boolean;
    stats: boolean;
    extendedChat: boolean;
  };
}

export interface BookChatUsage {
  bookId: number;
  book: {
    id: number;
    title: string;
    coverImage: string | null;
    type: string | null;
  } | null;
  totalRequests: number;
  monthlyRequests: number;
  lastUsedAt: string | null;
}

export interface ChatUsageResponse {
  summary: {
    limit: number;
    used: number;
    remaining: number;
    resetsAt: string | null;
    plan: 'free' | 'plus';
  };
  books: BookChatUsage[];
}

/**
 * Hook to fetch subscription info from backend
 * Includes chat limits (used, remaining, resetsAt)
 */
export function useSubscriptionInfo() {
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: async () => {
      const { data } = await api.get<SubscriptionInfo>('/me/subscription');
      return data;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook to fetch chat usage stats per book
 */
export function useChatUsage() {
  return useQuery({
    queryKey: queryKeys.chatUsage,
    queryFn: async () => {
      const { data } = await api.get<ChatUsageResponse>('/me/chat-usage');
      return data;
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Helper to format reset date
 */
export function formatResetDate(resetsAt: string | null, locale?: string): string {
  if (!resetsAt) return '';
  const date = new Date(resetsAt);
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  });
}
