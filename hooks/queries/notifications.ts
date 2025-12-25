import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';
import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  NotificationSettings,
} from '@/types/notification';

// Fetch notifications with pagination
async function fetchNotifications(page: number = 1): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/notifications', {
    params: { page, limit: 20 },
  });
  return data;
}

// Fetch unread count
async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return data.count;
}

// Mark a notification as read
async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

// Mark all notifications as read
async function markAllAsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

/**
 * Hook to get paginated notifications
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam = 1 }) => fetchNotifications(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.lastPage) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: staleTimes.realtime,
  });
}

/**
 * Hook to get unread notifications count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationsUnreadCount,
    queryFn: fetchUnreadCount,
    refetchInterval: 30000, // Refresh every 30s
    staleTime: staleTimes.realtime,
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });

      // Snapshot the previous data
      const previousData = queryClient.getQueryData(queryKeys.notifications);

      // Optimistically update notifications
      queryClient.setQueryData(queryKeys.notifications, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: NotificationsResponse) => ({
            ...page,
            data: page.data.map((n: Notification) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          })),
        };
      });

      // Decrement unread count
      queryClient.setQueryData(queryKeys.notificationsUnreadCount, (old: number | undefined) =>
        old !== undefined ? Math.max(0, old - 1) : 0
      );

      return { previousData };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.notifications, context.previousData);
      }
      // Refetch unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Mark all notifications as read
      queryClient.setQueryData(queryKeys.notifications, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: NotificationsResponse) => ({
            ...page,
            data: page.data.map((n: Notification) => ({ ...n, read: true })),
          })),
        };
      });
      // Reset unread count
      queryClient.setQueryData(queryKeys.notificationsUnreadCount, 0);
    },
  });
}

// Fetch notification settings
async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await api.get<NotificationSettings>('/me/notification-settings');
  return data;
}

// Update notification settings
async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const { data } = await api.patch<NotificationSettings>('/me/notification-settings', settings);
  return data;
}

/**
 * Hook to get notification settings
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: queryKeys.notificationSettings,
    queryFn: fetchNotificationSettings,
    staleTime: staleTimes.medium,
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationSettings,
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationSettings });

      // Snapshot the previous data
      const previousSettings = queryClient.getQueryData<NotificationSettings>(
        queryKeys.notificationSettings
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.notificationSettings, (old: NotificationSettings | undefined) => ({
        ...old,
        ...newSettings,
      }));

      return { previousSettings };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.notificationSettings, context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationSettings });
    },
  });
}
