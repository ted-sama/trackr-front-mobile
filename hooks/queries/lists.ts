import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import { api } from '@/services/api';
import { List } from '@/types/list';
import { PaginatedResponse } from '@/types/api';
import { queryKeys } from './keys';
import { useUserStore } from '@/stores/userStore';

async function fetchLists(): Promise<List[]> {
  const { data } = await api.get<PaginatedResponse<List>>('/lists');
  return data.data;
}

async function fetchMyLists(page: number, q?: string): Promise<PaginatedResponse<List>> {
  const { data } = await api.get<PaginatedResponse<List>>('/me/lists', {
    params: { page, limit: 20, q },
  });
  return data;
}

async function fetchList(id: string): Promise<List> {
  const { data } = await api.get<List>(`/lists/${id}`);
  return data;
}

async function updateListRequest(listId: string, updatedList: Partial<List>): Promise<List> {
  const { data } = await api.patch<List>(`/lists/${listId}`, updatedList);
  return data;
}

async function updateBackdropImageRequest(listId: string, image: ImagePickerAsset): Promise<void> {
  const formData = new FormData();
  const uri = image.uri;
  const fileName = (image as any).fileName || uri.split('/').pop() || 'photo.jpg';
  const mimeType = image.mimeType || 'image/jpeg';
  // @ts-ignore React Native FormData file
  formData.append('backdrop', { uri, name: fileName, type: mimeType });
  await api.put(`/lists/${listId}/backdrop`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

async function reorderBooksRequest(listId: string, positions: string[]): Promise<void> {
  await api.put(`/lists/${listId}/books/reorder`, { bookIds: positions });
}

async function createList(name: string): Promise<List> {
  const { data } = await api.post<List>('/lists', { name, isPublic: false });
  return data;
}

async function addBookToList(listId: string, bookId: string): Promise<void> {
  await api.post(`/lists/${listId}/books`, { bookId });
}

async function removeBookFromList(listId: string, bookId: string): Promise<void> {
  await api.delete(`/lists/${listId}/books`, { data: { bookId } });
}

async function deleteList(listId: string): Promise<void> {
  await api.delete(`/lists/${listId}`);
}

async function likeList(listId: string): Promise<void> {
  await api.post(`/lists/${listId}/like`);
}

async function unlikeList(listId: string): Promise<void> {
  await api.delete(`/lists/${listId}/like`);
}

async function saveList(listId: string): Promise<void> {
  await api.post(`/lists/${listId}/save`);
}

async function unsaveList(listId: string): Promise<void> {
  await api.delete(`/lists/${listId}/save`);
}

export function useLists() {
  return useQuery({ queryKey: queryKeys.lists, queryFn: fetchLists });
}

export function useMyLists(q?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.myLists(q),
    queryFn: ({ pageParam }) => fetchMyLists(pageParam ?? 1, q),
    getNextPageParam: (lastPage) => {
      const { currentPage, lastPage: last } = lastPage.meta;
      return currentPage < last ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useList(id?: string) {
  return useQuery({
    queryKey: id ? queryKeys.list(id) : queryKeys.list('missing-id'),
    queryFn: () => {
      const list = fetchList(id as string);
      return list;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, updated }: { listId: string; updated: Partial<List> }) => updateListRequest(listId, updated),
    onSuccess: (freshList) => {
      qc.setQueryData(queryKeys.list(freshList.id), freshList);
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
      const ownerId = freshList.owner?.id;
      if (ownerId) {
        qc.invalidateQueries({ queryKey: queryKeys.userLists(ownerId) });
      }
    },
  });
}

export function useUpdateBackdropImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, image }: { listId: string; image: ImagePickerAsset }) => updateBackdropImageRequest(listId, image),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.list(vars.listId) });
    },
  });
}

export function useReorderBooksInList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, positions }: { listId: string; positions: string[] }) => reorderBooksRequest(listId, positions),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.list(vars.listId) });
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createList(name),
    onSuccess: (newList) => {
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
      qc.invalidateQueries({ queryKey: queryKeys.userCreatedLists() });
      const ownerId = newList.owner?.id ?? useUserStore.getState().currentUser?.id;
      const ownerUsername = newList.owner?.username ?? useUserStore.getState().currentUser?.username;
      if (ownerId) {
        qc.invalidateQueries({ queryKey: queryKeys.userLists(ownerId) });
      }
      if (ownerUsername) {
        qc.invalidateQueries({ queryKey: queryKeys.userCreatedLists(ownerUsername) });
      }
    },
  });
}

export function useAddBookToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, bookId }: { listId: string; bookId: string }) => addBookToList(listId, bookId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.list(vars.listId) });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
      qc.invalidateQueries({ queryKey: queryKeys.userCreatedLists() });
      const cachedList = qc.getQueryData<List>(queryKeys.list(vars.listId));
      const ownerId = cachedList?.owner?.id ?? useUserStore.getState().currentUser?.id;
      const ownerUsername = cachedList?.owner?.username ?? useUserStore.getState().currentUser?.username;
      if (ownerId) {
        qc.invalidateQueries({ queryKey: queryKeys.userLists(ownerId) });
      }
      if (ownerUsername) {
        qc.invalidateQueries({ queryKey: queryKeys.userCreatedLists(ownerUsername) });
      }
    },
  });
}

export function useRemoveBookFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, bookId }: { listId: string; bookId: string }) => removeBookFromList(listId, bookId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.list(vars.listId) });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
      qc.invalidateQueries({ queryKey: queryKeys.userCreatedLists() });
      const cachedList = qc.getQueryData<List>(queryKeys.list(vars.listId));
      const ownerId = cachedList?.owner?.id ?? useUserStore.getState().currentUser?.id;
      const ownerUsername = cachedList?.owner?.username ?? useUserStore.getState().currentUser?.username;
      if (ownerId) {
        qc.invalidateQueries({ queryKey: queryKeys.userLists(ownerId) });
      }
      if (ownerUsername) {
        qc.invalidateQueries({ queryKey: queryKeys.userCreatedLists(ownerUsername) });
      }
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onSuccess: (_data, listId) => {
      const cachedList = qc.getQueryData<List>(queryKeys.list(listId));
      const ownerId = cachedList?.owner?.id ?? useUserStore.getState().currentUser?.id;
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.removeQueries({ queryKey: queryKeys.list(listId) });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
      if (ownerId) {
        qc.invalidateQueries({ queryKey: queryKeys.userLists(ownerId) });
      }
    },
  });
}

export function useLikeList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => likeList(listId),
    onMutate: async (listId) => {
      // Cancel ALL queries to prevent any in-flight request from overwriting our update
      await qc.cancelQueries({ queryKey: queryKeys.list(listId) });
      await qc.cancelQueries({ queryKey: queryKeys.lists });
      await qc.cancelQueries({ queryKey: queryKeys.myListsBase });

      // Get previous data for rollback
      const previousList = qc.getQueryData<List>(queryKeys.list(listId));

      // Optimistic update
      if (previousList) {
        const updatedList = {
          ...previousList,
          isLikedByMe: true,
          likesCount: previousList.likesCount + 1,
        };
        qc.setQueryData<List>(queryKeys.list(listId), updatedList);
      }

      return { previousList };
    },
    onError: (_err, listId, context) => {
      // Rollback on error
      if (context?.previousList) {
        qc.setQueryData(queryKeys.list(listId), context.previousList);
      }
    },
    onSuccess: async (_data, listId) => {
      // Force refetch the specific list query to ensure all observers get updated
      await qc.refetchQueries({ queryKey: queryKeys.list(listId), exact: true });
      // Invalidate collection queries
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}

export function useUnlikeList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => unlikeList(listId),
    onMutate: async (listId) => {
      // Cancel ALL queries to prevent any in-flight request from overwriting our update
      await qc.cancelQueries({ queryKey: queryKeys.list(listId) });
      await qc.cancelQueries({ queryKey: queryKeys.lists });
      await qc.cancelQueries({ queryKey: queryKeys.myListsBase });

      // Get previous data for rollback
      const previousList = qc.getQueryData<List>(queryKeys.list(listId));

      // Optimistic update
      if (previousList) {
        const updatedList = {
          ...previousList,
          isLikedByMe: false,
          likesCount: Math.max(0, previousList.likesCount - 1),
        };
        qc.setQueryData<List>(queryKeys.list(listId), updatedList);
      }

      return { previousList };
    },
    onError: (_err, listId, context) => {
      // Rollback on error
      if (context?.previousList) {
        qc.setQueryData(queryKeys.list(listId), context.previousList);
      }
    },
    onSuccess: async (_data, listId) => {
      // Force refetch the specific list query to ensure all observers get updated
      await qc.refetchQueries({ queryKey: queryKeys.list(listId), exact: true });
      // Invalidate collection queries
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}

export function useSaveList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => saveList(listId),
    onMutate: async (listId) => {
      // Cancel ALL queries to prevent any in-flight request from overwriting our update
      await qc.cancelQueries({ queryKey: queryKeys.list(listId) });
      await qc.cancelQueries({ queryKey: queryKeys.lists });
      await qc.cancelQueries({ queryKey: queryKeys.myListsBase });

      // Get previous data for rollback
      const previousList = qc.getQueryData<List>(queryKeys.list(listId));

      // Optimistic update
      if (previousList) {
        const updatedList = {
          ...previousList,
          isSavedByMe: true,
        };
        qc.setQueryData<List>(queryKeys.list(listId), updatedList);
      }

      return { previousList };
    },
    onError: (_err, listId, context) => {
      // Rollback on error
      if (context?.previousList) {
        qc.setQueryData(queryKeys.list(listId), context.previousList);
      }
    },
    onSuccess: async (_data, listId) => {
      // Force refetch the specific list query to ensure all observers get updated
      await qc.refetchQueries({ queryKey: queryKeys.list(listId), exact: true });
      // Invalidate collection queries
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}

export function useUnsaveList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => unsaveList(listId),
    onMutate: async (listId) => {
      // Cancel ALL queries to prevent any in-flight request from overwriting our update
      await qc.cancelQueries({ queryKey: queryKeys.list(listId) });
      await qc.cancelQueries({ queryKey: queryKeys.lists });
      await qc.cancelQueries({ queryKey: queryKeys.myListsBase });

      // Get previous data for rollback
      const previousList = qc.getQueryData<List>(queryKeys.list(listId));

      // Optimistic update
      if (previousList) {
        const updatedList = {
          ...previousList,
          isSavedByMe: false,
        };
        qc.setQueryData<List>(queryKeys.list(listId), updatedList);
      }

      return { previousList };
    },
    onError: (_err, listId, context) => {
      // Rollback on error
      if (context?.previousList) {
        qc.setQueryData(queryKeys.list(listId), context.previousList);
      }
    },
    onSuccess: async (_data, listId) => {
      // Force refetch the specific list query to ensure all observers get updated
      await qc.refetchQueries({ queryKey: queryKeys.list(listId), exact: true });
      // Invalidate collection queries
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.myListsBase });
      qc.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}


