import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, StarHalf, Clock, History, Flag, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { TrueSheet } from "@lodev09/react-native-true-sheet";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useReview, useToggleReviewLike } from "@/hooks/queries/reviews";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import Avatar from "@/components/ui/Avatar";
import PlusBadge from "@/components/ui/PlusBadge";
import LikeButton from "@/components/ui/LikeButton";
import ReportBottomSheet from "@/components/ReportBottomSheet";
import { useUserStore } from "@/stores/userStore";
import { useAuth } from "@/contexts/AuthContext";
import { BookReviewRevision } from "@/types/review";
import PillButton from "@/components/ui/PillButton";

dayjs.extend(relativeTime);

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ReviewDetailScreen() {
  const { id, reviewId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const bookId = id as string;
  const reviewIdStr = reviewId as string;
  
  const { data: review, isLoading, refetch } = useReview(bookId, reviewIdStr);
  const { currentUser } = useUserStore();
  const { isAuthenticated } = useAuth();
  const { mutate: toggleLike } = useToggleReviewLike(bookId);
  const reportSheetRef = useRef<TrueSheet>(null);

  const isOwnReview = currentUser?.id === review?.userId;
  const hasRevisions = review?.revisions && review.revisions.length > 0;
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLikePress = () => {
    if (isOwnReview || !review) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike({ reviewId: review.id, isLiked: review.isLikedByMe });
  };

  const handleUserPress = () => {
    if (!review) return;
    router.push(`/profile/${review.user.username}`);
  };

  const handleReportPress = () => {
    if (!review || isOwnReview || !isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reportSheetRef.current?.present();
  };

  const formattedDate = review ? dayjs(review.createdAt).fromNow() : "";
  const formattedFullDate = review ? dayjs(review.createdAt).format("DD/MM/YYYY HH:mm") : "";
  const wasEdited = review && review.updatedAt !== review.createdAt;
  const editedDate = wasEdited ? dayjs(review.updatedAt).fromNow() : "";

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={t("reviews.reviewDetail")}
          scrollY={scrollY}
          onBack={() => router.back()}
        />
        <View style={[styles.content, { paddingTop: insets.top + 70 }]}>
          <View style={styles.userSection}>
            <SkeletonLoader width={48} height={48} style={{ borderRadius: 24 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <SkeletonLoader width={120} height={18} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={80} height={14} />
            </View>
          </View>
          <SkeletonLoader width="100%" height={200} style={{ marginTop: 24, borderRadius: 0 }} />
        </View>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={t("reviews.reviewDetail")}
          scrollY={scrollY}
          onBack={() => router.back()}
        />
        <View style={[styles.content, styles.emptyContainer, { paddingTop: insets.top + 70 }]}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            {t("reviews.noReviews")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t("reviews.reviewDetail")}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* User Section */}
        <Pressable 
          onPress={handleUserPress} 
          style={styles.userSection}
          onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
        >
          <Avatar image={review.user.avatar} size={48} />
          <View style={styles.userMeta}>
            <View style={styles.usernameRow}>
              <Text style={[typography.categoryTitle, { color: colors.text }]} numberOfLines={1}>
                {review.user.displayName}
              </Text>
              {review.user.plan === "plus" && (
                <View style={{ marginLeft: 6 }}>
                  <PlusBadge />
                </View>
              )}
            </View>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {review.user.username}
            </Text>
          </View>
        </Pressable>

        {/* Rating Stars and Spoiler Badge */}
        <View style={styles.ratingSection}>
          {review.rating !== null && (
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => {
                const fullStars = Math.floor(review.rating!);
                const hasHalf = review.rating! % 1 !== 0;
                const isHalf = star === fullStars + 1 && hasHalf;
                const isFull = star <= fullStars;

                if (isHalf) {
                  return (
                    <StarHalf
                      key={star}
                      size={15}
                      fill={colors.primary}
                      color={colors.primary}
                      style={{ marginRight: 4 }}
                    />
                  );
                }
                return (
                  <Star
                    key={star}
                    size={15}
                    fill={isFull ? colors.primary : "transparent"}
                    color={isFull ? colors.primary : colors.border}
                    style={{ marginRight: 4 }}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Review Content */}
        <View style={[styles.contentSection, { borderColor: colors.border }]}>
          {review.isSpoiler && !spoilerRevealed ? (
            <Pressable
              style={[styles.spoilerOverlay, { backgroundColor: currentTheme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.08)" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSpoilerRevealed(true);
              }}
            >
              <View style={styles.spoilerContent}>
                <AlertTriangle size={32} color={colors.secondaryText} />
                <Text style={[typography.body, { color: colors.secondaryText, marginTop: 12, fontWeight: "600", textAlign: "center" }]}>
                  {t("reviews.containsSpoilerWarning")}
                </Text>
              </View>
            </Pressable>
          ) : (
            <Text style={[typography.body, { color: colors.text, lineHeight: 26 }]}>
              {review.content}
            </Text>
          )}
        </View>

        {/* Date and Edited Info */}
        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            <Clock size={14} color={colors.secondaryText} />
            <Text style={[typography.caption, { color: colors.secondaryText, marginLeft: 6 }]}>
              {formattedDate} · {formattedFullDate}
            </Text>
          </View>
          {wasEdited && (
            <View style={[styles.dateRow, { marginTop: 4 }]}>
              <History size={14} color={colors.secondaryText} />
              <Text style={[typography.caption, { color: colors.secondaryText, marginLeft: 6 }]}>
                {t("reviews.edited")} {editedDate}
              </Text>
            </View>
          )}
        </View>

        {/* Actions: Like & Report */}
        <View style={styles.actionsSection}>
          <LikeButton
            isLiked={review.isLikedByMe}
            count={review.likesCount}
            onPress={handleLikePress}
            disabled={isOwnReview}
          />
          {!isOwnReview && isAuthenticated && (
            <PillButton
              title={t("report.report")}
              onPress={handleReportPress}
              icon={<Flag size={16} color={colors.secondaryText} />}
            />
          )}
        </View>

        {/* Previous Versions */}
        {hasRevisions && (
          <View style={[styles.revisionsSection, { borderColor: colors.border }]}>
            <View style={styles.revisionsSectionHeader}>
              <Text style={[typography.categoryTitle, { color: colors.text }]}>
                {t("reviews.previousVersions")}
              </Text>
              <Text style={[typography.caption, { color: colors.secondaryText, marginLeft: 8 }]}>
                {review.revisionsCount} {review.revisionsCount === 1 ? t("reviews.revision") : t("reviews.revisions")}
              </Text>
            </View>
            {review.revisions?.map((revision: BookReviewRevision, index: number) => (
              <View 
                key={revision.id} 
                style={[
                  styles.revisionItem,
                  { 
                    borderColor: colors.border,
                    backgroundColor: currentTheme === "dark" 
                      ? "rgba(255,255,255,0.02)" 
                      : "rgba(0,0,0,0.02)",
                  },
                  index < (review.revisions?.length ?? 0) - 1 && { marginBottom: 12 }
                ]}
              >
                <View style={styles.revisionHeader}>
                  <View style={styles.revisionHeaderLeft}>
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      {t("reviews.version", { number: (review.revisions?.length ?? 0) - index })}
                    </Text>
                    {revision.rating !== null && (
                      <View style={styles.revisionRating}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const fullStars = Math.floor(revision.rating!);
                          const hasHalf = revision.rating! % 1 !== 0;
                          const isHalf = star === fullStars + 1 && hasHalf;
                          const isFull = star <= fullStars;

                          if (isHalf) {
                            return (
                              <StarHalf
                                key={star}
                                size={12}
                                fill={colors.primary}
                                color={colors.primary}
                                style={{ marginRight: 2 }}
                              />
                            );
                          }
                          return (
                            <Star
                              key={star}
                              size={12}
                              fill={isFull ? colors.primary : "transparent"}
                              color={isFull ? colors.primary : colors.border}
                              style={{ marginRight: 2 }}
                            />
                          );
                        })}
                      </View>
                    )}
                  </View>
                  <Text style={[typography.caption, { color: colors.secondaryText }]}>
                    {dayjs(revision.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </View>
                <Text 
                  style={[
                    typography.body, 
                    { color: colors.secondaryText, marginTop: 8, lineHeight: 22 }
                  ]}
                >
                  {revision.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </AnimatedScrollView>

      {/* Report Bottom Sheet */}
      {review && !isOwnReview && (
        <ReportBottomSheet
          ref={reportSheetRef}
          resourceType="review"
          resourceId={review.id.toString()}
          resourceName={review.user.displayName}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  userMeta: {
    marginLeft: 12,
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingSection: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spoilerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contentSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  spoilerOverlay: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 150,
  },
  spoilerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 12,
    minHeight: 150,
  },
  revealButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  dateSection: {
    marginTop: 20,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsSection: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  revisionsSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  revisionsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  revisionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  revisionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revisionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  revisionRating: {
    flexDirection: "row",
    alignItems: "center",
  },
});
