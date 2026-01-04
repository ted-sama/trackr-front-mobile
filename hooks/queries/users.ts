import { useMutation, useQuery, useQueryClient, useInfiniteQuery, QueryClient } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import { api } from '@/services/api';
import { Book, TrackedBookWithMeta } from '@/types/book';
import { useUserStore } from '@/stores/userStore';
import { PaginatedResponse } from '@/types/api';
import { List } from '@/types/list';
import { User } from '@/types/user';
import { ActivityLog } from '@/types/activityLog';
import { UserStats } from '@/types/stats';
import { TrackedBook } from '@/types/tracked-book';
import { BookTracking, ReadingStatus } from '@/types/reading-status';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';

function invalidateUserQueries(qc: QueryClient, userId?: string) {
  qc.invalidateQueries({ queryKey: ['user', 'top', 'me'], refetchType: 'active' });
  qc.invalidateQueries({ queryKey: queryKeys.userLists(), refetchType: 'active' });
  qc.invalidateQueries({ queryKey: queryKeys.myListsBase, refetchType: 'active' });

  if (!userId) return;

  qc.invalidateQueries({ queryKey: queryKeys.user(userId), refetchType: 'active' });
  qc.invalidateQueries({ queryKey: ['user', 'top', userId], refetchType: 'active' });
  qc.invalidateQueries({ queryKey: queryKeys.userLists(userId), refetchType: 'active' });
}

function syncUserCache(qc: QueryClient, user?: User | null) {
  invalidateUserQueries(qc, user?.id);
  if (!user?.id) return;
  qc.setQueryData(queryKeys.user(user.id), user);
}

async function refreshCurrentUser(qc: QueryClient): Promise<User | null> {
  await useUserStore.getState().fetchCurrentUser();
  const user = useUserStore.getState().currentUser;
  syncUserCache(qc, user);
  return user;
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: async () => (await api.get<User>(`/users/${userId}`)).data,
    enabled: Boolean(userId),
  });
}

export function useUserTop(userId?: string) {
  const { currentUser } = useUserStore();
  const isMe = !userId || userId === currentUser?.id;
  const endpoint = isMe ? '/me/top' : `/users/${userId}/top`; // nécessite /users/:id/top côté API

  return useQuery({
    queryKey: ['user', 'top', isMe ? 'me' : userId],
    queryFn: async () => (await api.get<Book[]>(endpoint)).data,
    enabled: isMe || Boolean(userId),
    staleTime: staleTimes.user,
  });
}

const PER_PAGE = 20;

export function useUserLists(userId?: string, search?: string) {
  const { currentUser } = useUserStore();
  const isMe = !userId || userId === currentUser?.id;
  const endpoint = isMe ? '/me/lists' : `/users/${userId}/lists`;

  return useInfiniteQuery({
    queryKey: [...queryKeys.userLists(isMe ? undefined : userId), search ?? ''],
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const params: Record<string, string | number | undefined> = {
        page,
        limit: PER_PAGE,
        q: search,
      };
      const { data } = await api.get<PaginatedResponse<List>>(endpoint, {
        params,
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const {
        currentPage,
        lastPage,
      } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    enabled: isMe || Boolean(userId),
    staleTime: staleTimes.user,
  });
}

export function useUserCreatedLists(username?: string, search?: string) {
  const { currentUser } = useUserStore();
  // Ensure username is a non-empty string for proper comparison
  const normalizedUsername = username?.trim() || undefined;
  const isMe = !normalizedUsername || normalizedUsername === currentUser?.username;
  const targetUsername = normalizedUsername || currentUser?.username;
  // For current user, use /me/lists to get all lists (including private ones)
  // For other users, use /users/${username}/lists (which only returns public lists)
  const endpoint = isMe ? '/me/lists' : `/users/${targetUsername}/lists`;

  return useInfiniteQuery({
    queryKey: [...queryKeys.userCreatedLists(isMe ? undefined : targetUsername), search ?? ''],
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const params: Record<string, string | number | undefined> = {
        page,
        limit: PER_PAGE,
        q: search,
      };
      const { data } = await api.get<PaginatedResponse<List>>(endpoint, {
        params,
      });

      // For current user, filter to only show lists created by them (exclude saved lists from others)
      if (isMe && currentUser?.id) {
        const filteredData = data.data.filter((list) => list.owner.id === currentUser.id);
        return {
          ...data,
          data: filteredData,
        };
      }

      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const {
        currentPage,
        lastPage,
      } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    enabled: isMe ? Boolean(currentUser?.id) : Boolean(targetUsername),
    staleTime: staleTimes.user,
  });
}

// --- Mutations for updating current user ---

async function updateMeRequest(updated: Partial<User>): Promise<User> {
  const { data } = await api.patch<User>('/me', updated);
  return data;
}

async function uploadAvatarRequest(image: ImagePickerAsset): Promise<void> {
  const formData = new FormData();
  const uri = image.uri;
  const fileName = (image as any).fileName || uri.split('/').pop() || 'avatar.jpg';
  const mimeType = image.mimeType || 'image/jpeg';
  // @ts-ignore React Native FormData file
  formData.append('avatar', { uri, name: fileName, type: mimeType });
  await api.put('/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

async function deleteAvatarRequest(): Promise<void> {
  await api.delete('/me/avatar');
}

async function uploadBackdropRequest(image: ImagePickerAsset): Promise<void> {
  const formData = new FormData();
  const uri = image.uri;
  const fileName = (image as any).fileName || uri.split('/').pop() || 'backdrop.jpg';
  const mimeType = image.mimeType || 'image/jpeg';
  // @ts-ignore React Native FormData file
  formData.append('backdrop', { uri, name: fileName, type: mimeType });
  await api.put('/me/backdrop', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

async function addBookToFavoritesRequest(bookId: string): Promise<void> {
  const { data } = await api.post(`/me/top/${bookId}`);
  return data;
}

async function removeBookFromFavoritesRequest(bookId: string): Promise<void> {
  const { data } = await api.delete(`/me/top/${bookId}`);
  return data;
}

async function reorderTopRequest(bookIds: string[]): Promise<void> {
  await api.put('/me/top/reorder', { bookIds });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updated: Partial<User>) => updateMeRequest(updated),
    onSuccess: async (freshUser) => {
      useUserStore.getState().setUser(freshUser);
      const hydratedUser = await refreshCurrentUser(qc);
      if (!hydratedUser) syncUserCache(qc, freshUser);
    },
  });
}

export function useUpdateUserAvatarImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (image: ImagePickerAsset) => uploadAvatarRequest(image),
    onSuccess: async () => {
      await refreshCurrentUser(qc);
    },
  });
}

export function useDeleteUserAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAvatarRequest(),
    onSuccess: async () => {
      await refreshCurrentUser(qc);
    },
  });
}

export function useUpdateUserBackdropImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (image: ImagePickerAsset) => uploadBackdropRequest(image),
    onSuccess: async () => {
      await refreshCurrentUser(qc);
    },
  });
}

export function useAddBookToFavorites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => addBookToFavoritesRequest(bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'top', 'me'] });
    },
  });
}

export function useRemoveBookFromFavorites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => removeBookFromFavoritesRequest(bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'top', 'me'] });
    },
  });
}

export function useReorderUserTop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookIds: string[]) => reorderTopRequest(bookIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'top', 'me'] });
    },
  });
}

export function useUserActivity(username?: string) {
  const { currentUser } = useUserStore();
  // Ensure username is a non-empty string for proper comparison
  const normalizedUsername = username?.trim() || undefined;
  const isMe = !normalizedUsername || normalizedUsername === currentUser?.username;
  const endpoint = isMe ? '/me/activity' : `/users/${normalizedUsername}/activity`;

  return useInfiniteQuery({
    queryKey: ['user', 'activity', isMe ? 'me' : normalizedUsername],
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const { data } = await api.get<PaginatedResponse<ActivityLog>>(endpoint, {
        params: {
          page,
          limit: 10,
        },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const { currentPage, lastPage } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    enabled: isMe || Boolean(normalizedUsername),
    staleTime: staleTimes.realtime,
  });
}

// Get device timezone (e.g., 'Europe/Paris')
const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useMeStats() {
  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: async () => (await api.get<UserStats>('/me/stats', {
      params: { timezone: getTimezone() }
    })).data,
    staleTime: staleTimes.user,
  });
}

export function useUserStats(username?: string) {
  const { currentUser } = useUserStore();
  // Ensure username is a non-empty string for proper comparison
  const normalizedUsername = username?.trim() || undefined;
  const isMe = !normalizedUsername || normalizedUsername === currentUser?.username;
  const endpoint = isMe ? '/me/stats' : `/users/${normalizedUsername}/stats`;

  return useQuery({
    queryKey: queryKeys.userStats(isMe ? undefined : normalizedUsername),
    queryFn: async () => (await api.get<UserStats>(endpoint, {
      params: { timezone: getTimezone() }
    })).data,
    enabled: isMe || Boolean(normalizedUsername),
    staleTime: staleTimes.user,
  });
}

export function useStatsFilteredBooks(
  chartType: string,
  filterValue: string,
  username?: string
) {
  const { currentUser } = useUserStore();
  // Ensure username is a non-empty string for proper comparison
  const normalizedUsername = username?.trim() || undefined;
  const isMe = !normalizedUsername || normalizedUsername === currentUser?.username;
  const endpoint = isMe ? '/me/stats/books' : `/users/${normalizedUsername}/stats/books`;

  return useQuery({
    queryKey: ['stats', 'books', chartType, filterValue, isMe ? 'me' : normalizedUsername],
    queryFn: async () => {
      const response = await api.get<{ data: TrackedBookWithMeta[] }>(endpoint, {
        params: { chartType, filterValue }
      });
      return response.data.data;
    },
    enabled: Boolean(chartType) && Boolean(filterValue),
    staleTime: staleTimes.user,
  });
}

export function useUserBooks(username?: string) {
  const { currentUser } = useUserStore();
  // Ensure username is a non-empty string for proper comparison
  const normalizedUsername = username?.trim() || undefined;
  const isMe = !normalizedUsername || normalizedUsername === currentUser?.username;
  const endpoint = isMe ? '/me/books' : `/users/${normalizedUsername}/books`;

  return useQuery({
    queryKey: queryKeys.userBooks(isMe ? undefined : normalizedUsername),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<TrackedBook>>(endpoint, {
        params: { offset: 0, limit: 1000 }
      });

      // Transform TrackedBook[] to TrackedBookWithMeta[]
      const transformedBooks: TrackedBookWithMeta[] = data.data.map((trackedBook) => {
        const bookData = trackedBook.book;

        const trackingStatus: BookTracking = {
          status: trackedBook.status as ReadingStatus,
          currentChapter: trackedBook.currentChapter,
          currentVolume: trackedBook.currentVolume,
          rating: trackedBook.rating,
          startDate: trackedBook.startDate ? new Date(trackedBook.startDate) : null,
          finishDate: trackedBook.finishDate ? new Date(trackedBook.finishDate) : null,
          notes: trackedBook.notes,
          lastReadAt: trackedBook.lastReadAt ? new Date(trackedBook.lastReadAt) : null,
          createdAt: trackedBook.createdAt ? new Date(trackedBook.createdAt) : null,
          updatedAt: trackedBook.updatedAt ? new Date(trackedBook.updatedAt) : null,
        };

        return {
          ...bookData,
          tracking: true,
          trackingStatus,
        };
      });

      return transformedBooks;
    },
    enabled: isMe || Boolean(normalizedUsername),
    staleTime: staleTimes.user,
  });
}