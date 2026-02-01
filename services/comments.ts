import { api } from "./api";
import {
  ReviewComment,
  CreateCommentDTO,
  UpdateCommentDTO,
} from "@/types/comment";
import { User } from "@/types/user";

export const commentsApi = {
  getReviewComments: async (reviewId: number): Promise<ReviewComment[]> => {
    const { data } = await api.get<ReviewComment[]>(
      `/reviews/${reviewId}/comments`,
    );
    return data;
  },

  createComment: async (
    reviewId: number,
    dto: CreateCommentDTO,
  ): Promise<ReviewComment> => {
    const { data } = await api.post<ReviewComment>(
      `/reviews/${reviewId}/comments`,
      dto,
    );
    return data;
  },

  updateComment: async (
    commentId: number,
    dto: UpdateCommentDTO,
  ): Promise<ReviewComment> => {
    const { data } = await api.patch<ReviewComment>(
      `/comments/${commentId}`,
      dto,
    );
    return data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },

  likeComment: async (commentId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/like`);
  },

  unlikeComment: async (commentId: number): Promise<void> => {
    // Check if the backend supports unlike via DELETE or toggle via POST.
    // The prompt says "POST /comments/:id/like", usually implies toggle or there's a separate unlike.
    // Assuming delete for unlike based on standard REST patterns in this project, or re-using POST if it toggles.
    // Let's assume standard pattern found in reviews.ts (delete for unlike)
    await api.delete(`/comments/${commentId}/like`);
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const { data } = await api.get<User[]>(`/users/search`, {
      params: { q: query },
    });
    return data;
  },

  getCommentReplies: async (
    commentId: number,
    page: number = 1,
  ): Promise<ReviewComment[]> => {
    const { data } = await api.get<ReviewComment[]>(
      `/comments/${commentId}/replies`,
      { params: { page } },
    );
    return data;
  },
};
