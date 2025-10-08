import { useMutation, useQuery, useQueryClient, useInfiniteQuery, QueryClient } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import { api } from '@/services/api';
import { Book } from '@/types/book';
import { useUserStore } from '@/stores/userStore';
import { PaginatedResponse } from '@/types/api';
import { List } from '@/types/list';
import { User } from '@/types/user';
import { ActivityLog } from '@/types/activityLog';
import { queryKeys } from './keys';

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
    staleTime: 60_000,
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
    staleTime: 60_000,
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
  const isMe = !username || username === currentUser?.username;
  const endpoint = isMe ? '/me/activity' : `/users/${username}/activity`;

  return useInfiniteQuery({
    queryKey: ['user', 'activity', isMe ? 'me' : username],
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
    enabled: isMe || Boolean(username),
    staleTime: 30_000,
  });
}