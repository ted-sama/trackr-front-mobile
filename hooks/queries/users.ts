import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Book } from '@/types/book';
import { useUserStore } from '@/stores/userStore';
import { PaginatedResponse } from '@/types/api';
import { List } from '@/types/list';

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