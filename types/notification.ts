export type NotificationType = 'review_like' | 'list_like' | 'list_save' | 'new_follower' | 'new_friend';

export interface NotificationActor {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface NotificationResource {
  id: number | string;
  // For review_like
  content?: string;
  rating?: number;
  book?: {
    id: number;
    title: string;
    cover: string | null;
  };
  // For list_like / list_save
  name?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  resourceType: 'book_review' | 'list' | 'user';
  resourceId: string;
  read: boolean;
  createdAt: string;
  actor: NotificationActor;
  resource: NotificationResource | null;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationSettings {
  notifyReviewLikes: boolean;
  notifyListLikes: boolean;
  notifyListSaves: boolean;
  notifyNewFollower: boolean;
  notifyNewFriend: boolean;
}
