import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { User } from '@/types/user';
import { PaginatedResponse } from '@/types/api';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';
import { useUserStore } from '@/stores/userStore';

interface FollowResponse {
  message: string;
  isMutual: boolean;
}

interface UserWithRelationship extends User {
  isFollowedByMe?: boolean;
  isFollowingMe?: boolean;
  isFriend?: boolean;
}

const PER_PAGE = 20;

// Helper to update user relationship in cached lists
function updateUserInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  username: string,
  updates: { isFollowedByMe?: boolean; isFriend?: boolean }
) {
  const updateData = (oldData: { pages: PaginatedResponse<UserWithRelationship>[]; pageParams: unknown[] } | undefined) => {
    if (!oldData?.pages) return oldData;
    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        data: page.data.map((user) =>
          user.username === username ? { ...user, ...updates } : user
        ),
      })),
    };
  };

  // Update in all user followers/following queries (pattern: ['user', username, 'followers'|'following'])
  queryClient.setQueriesData<{ pages: PaginatedResponse<UserWithRelationship>[]; pageParams: unknown[] }>(
    {
      predicate: (query) => {
        const key = query.queryKey as string[];
        return Array.isArray(key) && key[0] === 'user' && (key[2] === 'followers' || key[2] === 'following');
      },
    },
    updateData
  );

  // Update in my followers/following queries (pattern: ['me', 'followers'|'following'])
  queryClient.setQueriesData<{ pages: PaginatedResponse<UserWithRelationship>[]; pageParams: unknown[] }>(
    {
      predicate: (query) => {
        const key = query.queryKey as string[];
        return Array.isArray(key) && key[0] === 'me' && (key[1] === 'followers' || key[1] === 'following');
      },
    },
    updateData
  );
}

// Follow a user
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { data } = await api.post<FollowResponse>(`/users/${username}/follow`);
      return data;
    },
    onSuccess: async (data, username) => {
      const currentUser = useUserStore.getState().currentUser;

      // Optimistically update user in cached lists
      updateUserInCache(queryClient, username, {
        isFollowedByMe: true,
        isFriend: data.isMutual,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user(username) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myFollowing });
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollowers(username) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedPopularAmongFollowing });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedRecentlyRated });
      // Also invalidate current user's following list (used by profile following screen)
      if (currentUser?.username) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userFollowing(currentUser.username) });
      }
      // Refresh current user to update followingCount
      await useUserStore.getState().fetchCurrentUser();
    },
  });
}

// Unfollow a user
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      await api.delete(`/users/${username}/follow`);
    },
    onSuccess: async (_data, username) => {
      const currentUser = useUserStore.getState().currentUser;

      // Optimistically update user in cached lists
      updateUserInCache(queryClient, username, {
        isFollowedByMe: false,
        isFriend: false,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user(username) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myFollowing });
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollowers(username) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedPopularAmongFollowing });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedRecentlyRated });
      // Also invalidate current user's following list (used by profile following screen)
      if (currentUser?.username) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userFollowing(currentUser.username) });
      }
      // Refresh current user to update followingCount
      await useUserStore.getState().fetchCurrentUser();
    },
  });
}

// Get followers of a user
export function useUserFollowers(username: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.userFollowers(username),
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const { data } = await api.get<PaginatedResponse<UserWithRelationship>>(
        `/users/${username}/followers`,
        { params: { page, limit: PER_PAGE } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const { currentPage, lastPage } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    enabled: Boolean(username),
    staleTime: staleTimes.user,
  });
}

// Get users that a user is following
export function useUserFollowing(username: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.userFollowing(username),
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const { data } = await api.get<PaginatedResponse<UserWithRelationship>>(
        `/users/${username}/following`,
        { params: { page, limit: PER_PAGE } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const { currentPage, lastPage } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    enabled: Boolean(username),
    staleTime: staleTimes.user,
  });
}

// Get current user's followers
export function useMyFollowers() {
  return useInfiniteQuery({
    queryKey: queryKeys.myFollowers,
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const { data } = await api.get<PaginatedResponse<UserWithRelationship>>(
        '/me/followers',
        { params: { page, limit: PER_PAGE } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const { currentPage, lastPage } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    staleTime: staleTimes.user,
  });
}

// Get users the current user is following
export function useMyFollowing() {
  return useInfiniteQuery({
    queryKey: queryKeys.myFollowing,
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1;
      const { data } = await api.get<PaginatedResponse<UserWithRelationship>>(
        '/me/following',
        { params: { page, limit: PER_PAGE } }
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPageData) => {
      const { currentPage, lastPage } = lastPageData.meta;
      return currentPage < lastPage ? currentPage + 1 : undefined;
    },
    staleTime: staleTimes.user,
  });
}
