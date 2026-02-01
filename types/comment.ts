export interface ReviewComment {
  id: number;
  reviewId: number;
  userId: string;
  parentId: number | null;
  content: string;
  likesCount: number;
  isLikedByMe: boolean;
  depth: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  replies?: ReviewComment[]; // For nested structure in UI
  hasMoreReplies?: boolean; // True if there are deeper replies not yet loaded
}

export interface CreateCommentDTO {
  content: string;
  parentId?: number | null;
}

export interface UpdateCommentDTO {
  content: string;
}
