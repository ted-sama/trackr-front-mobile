import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "@/services/comments";
import {
  CreateCommentDTO,
  UpdateCommentDTO,
  ReviewComment,
} from "@/types/comment";
import { staleTimes } from "@/lib/queryClient";

export const commentKeys = {
  reviewComments: (reviewId: number) => ["comments", "review", reviewId],
  commentReplies: (commentId: number) => ["comments", "replies", commentId],
  userSearch: (query: string) => ["users", "search", query],
};

export function useReviewComments(reviewId: number) {
  return useQuery({
    queryKey: commentKeys.reviewComments(reviewId),
    queryFn: () => commentsApi.getReviewComments(reviewId),
    staleTime: staleTimes.content,
  });
}

export function useCreateComment(reviewId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDTO) =>
      commentsApi.createComment(reviewId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.reviewComments(reviewId),
      });
    },
  });
}

export function useUpdateComment(reviewId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      dto,
    }: {
      commentId: number;
      dto: UpdateCommentDTO;
    }) => commentsApi.updateComment(commentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.reviewComments(reviewId),
      });
    },
  });
}

export function useDeleteComment(reviewId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.reviewComments(reviewId),
      });
    },
  });
}

export function useToggleCommentLike(reviewId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      isLiked,
    }: {
      commentId: number;
      isLiked: boolean;
    }) =>
      isLiked
        ? commentsApi.unlikeComment(commentId)
        : commentsApi.likeComment(commentId),
    onMutate: async ({ commentId, isLiked }) => {
      await queryClient.cancelQueries({
        queryKey: commentKeys.reviewComments(reviewId),
      });

      const previousComments = queryClient.getQueryData<ReviewComment[]>(
        commentKeys.reviewComments(reviewId),
      );

      queryClient.setQueryData<ReviewComment[]>(
        commentKeys.reviewComments(reviewId),
        (old) => {
          if (!old) return [];

          const updateCommentInTree = (
            comments: ReviewComment[],
          ): ReviewComment[] => {
            return comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  isLikedByMe: !isLiked,
                  likesCount: isLiked
                    ? comment.likesCount - 1
                    : comment.likesCount + 1,
                };
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: updateCommentInTree(comment.replies),
                };
              }
              return comment;
            });
          };

          return updateCommentInTree(old);
        },
      );

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          commentKeys.reviewComments(reviewId),
          context.previousComments,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.reviewComments(reviewId),
      });
    },
  });
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: commentKeys.userSearch(query),
    queryFn: () => commentsApi.searchUsers(query),
    enabled: query.length > 1,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCommentReplies(commentId: number, enabled: boolean = false) {
  return useQuery({
    queryKey: commentKeys.commentReplies(commentId),
    queryFn: () => commentsApi.getCommentReplies(commentId),
    staleTime: staleTimes.content,
    enabled,
  });
}
