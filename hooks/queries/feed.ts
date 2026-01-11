import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from './keys';
import { staleTimes } from '@/lib/queryClient';
import { RecentlyRatedItem, PopularAmongFollowingResponse } from '@/types/feed';

// Get books popular among users you follow
export function usePopularAmongFollowing() {
  return useQuery({
    queryKey: queryKeys.feedPopularAmongFollowing,
    queryFn: async () => {
      const { data } = await api.get<PopularAmongFollowingResponse>('/feed/popular-among-following');
      return data;
    },
    staleTime: staleTimes.user,
  });
}

// Get books recently rated by users you follow
export function useRecentlyRatedByFollowing() {
  return useQuery({
    queryKey: queryKeys.feedRecentlyRated,
    queryFn: async () => {
      const { data } = await api.get<RecentlyRatedItem[]>('/feed/recently-rated');
      return data;
    },
    staleTime: staleTimes.user,
  });
}
