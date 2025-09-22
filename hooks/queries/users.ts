import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import { api } from '@/services/api';
import { Book } from '@/types/book';
import { useUserStore } from '@/stores/userStore';
import { PaginatedResponse } from '@/types/api';
import { List } from '@/types/list';
import { User } from '@/types/user';

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

export function useUserLists(userId?: string) {
  const { currentUser } = useUserStore();
  const isMe = !userId || userId === currentUser?.id;
  const endpoint = isMe ? '/me/lists' : `/users/${userId}/lists`;

  return useQuery({
    queryKey: ['user', 'lists', isMe ? 'me' : userId],
    queryFn: async () => (await api.get<PaginatedResponse<List>>(endpoint)).data,
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

async function uploadBackdropRequest(image: ImagePickerAsset): Promise<void> {
  const formData = new FormData();
  const uri = image.uri;
  const fileName = (image as any).fileName || uri.split('/').pop() || 'backdrop.jpg';
  const mimeType = image.mimeType || 'image/jpeg';
  // @ts-ignore React Native FormData file
  formData.append('backdrop', { uri, name: fileName, type: mimeType });
  await api.put('/me/backdrop', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updated: Partial<User>) => updateMeRequest(updated),
    onSuccess: (freshUser) => {
      useUserStore.getState().setUser(freshUser);
      qc.invalidateQueries({ queryKey: ['user', 'top', 'me'] });
      qc.invalidateQueries({ queryKey: ['user', 'lists', 'me'] });
    },
  });
}

export function useUpdateUserAvatarImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (image: ImagePickerAsset) => uploadAvatarRequest(image),
    onSuccess: async () => {
      await useUserStore.getState().fetchCurrentUser();
      qc.invalidateQueries({ queryKey: ['user', 'top', 'me'] });
    },
  });
}

export function useUpdateUserBackdropImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (image: ImagePickerAsset) => uploadBackdropRequest(image),
    onSuccess: async () => {
      await useUserStore.getState().fetchCurrentUser();
      qc.invalidateQueries({ queryKey: ['user', 'top', 'me'] });
    },
  });
}