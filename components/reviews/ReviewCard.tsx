import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Star, History, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { BlurView } from "expo-blur";

import { BookReview } from "@/types/review";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";
import { useToggleReviewLike } from "@/hooks/queries/reviews";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";
import DotSeparator from "../ui/DotSeparator";

dayjs.extend(relativeTime);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Carousel constants - fixed values for consistent snap behavior
export const REVIEW_CARD_WIDTH = 350;
export const REVIEW_CARD_GAP = 16;
export const REVIEW_CARD_SIDE_SPACING = (SCREEN_WIDTH - REVIEW_CARD_WIDTH) / 2;

interface ReviewCardProps {
  review: BookReview;
  bookId: string;
  onPress?: () => void;
  variant?: "default" | "compact";
}

export function ReviewCard({
  review,
  bookId,
  onPress,
  variant = "default",
}: ReviewCardProps) {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { mutate: toggleLike } = useToggleReviewLike(bookId);
  const { currentUser } = useUserStore();
  const { t } = useTranslation();
  
  // Check if this is the current user's own review
  const isOwnReview = currentUser?.id === review.userId;

  // Track if text is truncated
  const [isTruncated, setIsTruncated] = useState(false);

  // Track if spoiler content is revealed
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  const scale = useSharedValue(1);
  const likeScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const handleLikePress = () => {
    // Don't allow liking own review
    if (isOwnReview) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeScale.value = withTiming(1.3, { duration: 100 });
    setTimeout(() => {
      likeScale.value = withTiming(1, { duration: 150 });
    }, 100);
    toggleLike({ reviewId: review.id, isLiked: review.isLikedByMe });
  };

  const handleUserPress = () => {
    router.push(`/profile/${review.user.username}`);
  };

  const handleTextLayout = (e: any) => {
    // Check if text is truncated (numberOfLines exceeded)
    setIsTruncated(e.nativeEvent.lines.length > 5);
  };

  const handleViewMore = () => {
    // Navigate to full reviews page where user can see complete review
    router.push(`/book/${bookId}/reviews`);
  };

  const formattedDate = dayjs(review.createdAt).fromNow();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            width: variant === "compact" ? "auto" : REVIEW_CARD_WIDTH,
          },
          animatedCardStyle,
        ]}
      >
        {/* Header: User info + Rating */}
        <View style={styles.header}>
          <Pressable onPress={handleUserPress} style={styles.userInfo}>
            <Avatar image={review.user.avatar} size={36} />
            <View style={styles.userMeta}>
              <View style={styles.usernameRow}>
                <Text
                  style={[typography.username, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {review.user.displayName}
                </Text>
                {review.user.plan === "plus" && (
                  <View style={{ marginLeft: 4 }}>
                    <PlusBadge />
                  </View>
                )}
              </View>
              <View style={styles.dateRow}>
                <Text
                  style={[typography.bodyCaption, { color: colors.secondaryText }]}
                >
                  {formattedDate}
                </Text>
                {review.revisionsCount > 0 && (
                  <>
                    <DotSeparator />
                    <History size={12} color={colors.secondaryText} />
                    <Text style={[typography.bodyCaption, { color: colors.secondaryText, marginLeft: 3 }]}>
                      {review.revisionsCount}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>

          <View style={styles.headerBadges}>
            {/* Rating Badge */}
            {review.rating !== null && (
              <View
                style={[
                  styles.ratingBadge,
                  {
                    backgroundColor: currentTheme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
              >
                <Star
                  size={12}
                  fill={colors.accent}
                  color={colors.accent}
                />
                <Text
                  style={[
                    typography.badge,
                    { color: colors.text, marginLeft: 3 },
                  ]}
                >
                  {review.rating}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        {review.isSpoiler && !spoilerRevealed ? (
          <Pressable
            style={[styles.spoilerOverlay, { backgroundColor: currentTheme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.08)" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSpoilerRevealed(true);
            }}
          >
            <View style={styles.spoilerContent}>
              <AlertTriangle size={24} color={colors.secondaryText} />
              <Text style={[typography.body, { color: colors.secondaryText, marginTop: 8, fontWeight: "600" }]}>
                {t("reviews.containsSpoilerWarning")}
              </Text>
            </View>
          </Pressable>
        ) : (
          <>
            <Text
              style={[
                typography.body,
                styles.content,
                { color: colors.text },
              ]}
              numberOfLines={variant === "compact" ? 3 : 5}
              onTextLayout={handleTextLayout}
            >
              {review.content}
            </Text>

            {/* View More Button */}
            {isTruncated && (
              <Text style={[typography.bodyBold, { color: colors.primary }]}>
                {t("book.viewMore")}
              </Text>
            )}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 200,
    // Shadow iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // Shadow Android
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userMeta: {
    marginLeft: 10,
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  spoilerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  content: {
    lineHeight: 22,
    flex: 1,
  },
  viewMoreButton: {
    paddingTop: 8,
    alignSelf: "flex-start",
  },
  spoilerOverlay: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  spoilerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  revealButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
});

export default React.memo(ReviewCard);

