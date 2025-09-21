import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { ImagePickerAsset } from 'expo-image-picker';
import { api } from '@/services/api';
import { List } from '@/types/list';
import { PaginatedResponse } from '@/types/api';
import { queryKeys } from './keys';

async function fetchLists(): Promise<List[]> {
  const { data } = await api.get<PaginatedResponse<List>>('/lists');
  return data.data;
}

async function fetchMyLists(page: number): Promise<PaginatedResponse<List>> {
  const { data } = await api.get<PaginatedResponse<List>>('/me/lists', {
    params: { page, limit: 20 },
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
  const { data } = await api.post<List>('/lists', { name });
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

export function useLists() {
  return useQuery({ queryKey: queryKeys.lists, queryFn: fetchLists });
}

export function useMyLists() {
  return useInfiniteQuery({
    queryKey: queryKeys.myLists,
    queryFn: ({ pageParam }) => fetchMyLists(pageParam ?? 1),
    getNextPageParam: (lastPage) => {
      const { currentPage, lastPage: last } = lastPage.meta;
      return currentPage < last ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useList(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.list(id) : ['list', 'missing-id'],
    queryFn: () => fetchList(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, updated }: { listId: string; updated: Partial<List> }) => updateListRequest(listId, updated),
    onSuccess: (freshList) => {
      qc.setQueryData(queryKeys.list(freshList.id), freshList);
      qc.invalidateQueries({ queryKey: queryKeys.myLists });
      qc.invalidateQueries({ queryKey: queryKeys.lists });
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
    },
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createList(name),
    onSuccess: (newList) => {
      qc.invalidateQueries({ queryKey: queryKeys.myLists });
      qc.invalidateQueries({ queryKey: queryKeys.lists });
    },
  });
}

export function useAddBookToList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, bookId }: { listId: string; bookId: string }) => addBookToList(listId, bookId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.list(vars.listId) });
    },
  });
}

export function useRemoveBookFromList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, bookId }: { listId: string; bookId: string }) => removeBookFromList(listId, bookId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.list(vars.listId) });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onSuccess: (_data, listId) => {
      qc.invalidateQueries({ queryKey: queryKeys.lists });
      qc.invalidateQueries({ queryKey: queryKeys.myLists });
      qc.removeQueries({ queryKey: queryKeys.list(listId) });
    },
  });
}


