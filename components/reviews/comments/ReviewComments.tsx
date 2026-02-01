import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { ReviewComment } from "@/types/comment";
import {
  useReviewComments,
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
} from "@/hooks/queries/comments";
import Avatar from "@/components/ui/Avatar";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CommentInput } from "./CommentInput";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

dayjs.extend(relativeTime);

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface CommentItemProps {
  comment: ReviewComment;
  depth?: number;
  onReply: (commentId: number, username: string) => void;
  onDelete: (commentId: number) => void;
}

const CommentItem = ({
  comment,
  depth = 0,
  onReply,
  onDelete,
}: CommentItemProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { currentUser } = useUserStore();
  const { mutate: toggleLike } = useToggleCommentLike(comment.reviewId);
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isOwnComment = currentUser?.id === comment.userId;
  const formattedDate = dayjs(comment.createdAt).fromNow();

  const scale = useSharedValue(1);

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(1.3, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 150 });
    });
    toggleLike({ commentId: comment.id, isLiked: comment.isLikedByMe });
  };

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 16 }]}>
      <View style={styles.commentHeader}>
        <Pressable onPress={toggleCollapse} style={styles.userInfo}>
          <Avatar image={comment.user.avatar || undefined} size={24} />
          <Text
            style={[typography.bodyBold, { color: colors.text, marginLeft: 8 }]}
          >
            {comment.user.displayName}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.secondaryText, marginLeft: 8 },
            ]}
          >
            {formattedDate}
          </Text>
        </Pressable>
        {isOwnComment && (
          <Pressable
            onPress={() => onDelete(comment.id)}
            style={styles.actionButton}
          >
            <Trash2 size={14} color={colors.secondaryText} />
          </Pressable>
        )}
      </View>

      {!isCollapsed && (
        <>
          <Text
            style={[
              typography.body,
              { color: colors.text, marginTop: 4, marginBottom: 8 },
            ]}
          >
            {comment.content}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable onPress={handleLike} style={styles.actionButton}>
              <Animated.View style={animatedLikeStyle}>
                <Heart
                  size={14}
                  color={
                    comment.isLikedByMe ? colors.error : colors.secondaryText
                  }
                  fill={comment.isLikedByMe ? colors.error : "transparent"}
                />
              </Animated.View>
              <Text
                style={[
                  typography.caption,
                  { color: colors.secondaryText, marginLeft: 4 },
                ]}
              >
                {comment.likesCount > 0 ? comment.likesCount : ""}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onReply(comment.id, comment.user.username)}
              style={[styles.actionButton, { marginLeft: 16 }]}
            >
              <MessageCircle size={14} color={colors.secondaryText} />
              <Text
                style={[
                  typography.caption,
                  { color: colors.secondaryText, marginLeft: 4 },
                ]}
              >
                {t("reviews.reply")}
              </Text>
            </Pressable>
          </View>

          {comment.replies &&
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
        </>
      )}

      {isCollapsed && comment.replies && comment.replies.length > 0 && (
        <Pressable onPress={toggleCollapse} style={{ marginTop: 4 }}>
          <Text style={[typography.caption, { color: colors.accent }]}>
            {t("reviews.viewReplies", { count: comment.replies.length })}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

interface ReviewCommentsProps {
  reviewId: number;
  bookId: string; // Passed to keep consistent with other components, though mostly used for invalidations
}

export function ReviewComments({ reviewId }: ReviewCommentsProps) {
  const { data: comments, isLoading } = useReviewComments(reviewId);
  const { mutate: createComment } = useCreateComment(reviewId);
  const { mutate: deleteComment } = useDeleteComment(reviewId);
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    username: string;
  } | null>(null);

  const handleReply = (commentId: number, username: string) => {
    setReplyingTo({ id: commentId, username });
  };

  const handleSubmit = (content: string) => {
    createComment({
      content,
      parentId: replyingTo?.id,
    });
    setReplyingTo(null);
  };

  const handleDelete = (commentId: number) => {
    // Add confirmation dialog ideally
    deleteComment(commentId);
  };

  // Transform flat comments to nested structure if backend returns flat list
  // Assuming backend returns nested structure based on interfaces, but here's a safety check or simple pass-through
  // If backend returns flat list with parentId, we'd need to reconstruct the tree here.
  // For now assuming backend handles nesting or we render flat with indentation logic if we wanted.
  // Based on CommentItem recursive rendering, we expect 'replies' in the comment object.

  if (isLoading) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.secondaryText }}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t("reviews.comments")} ({comments?.length || 0})
        </Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            onReply={handleReply}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.body, { color: colors.secondaryText }]}>
              {t("reviews.noComments")}
            </Text>
          </View>
        }
      />

      <CommentInput
        onSubmit={handleSubmit}
        isReply={!!replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        placeholder={
          replyingTo
            ? `${t("reviews.replyingTo")} @${replyingTo.username}`
            : undefined
        }
        autoFocus={!!replyingTo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
});
