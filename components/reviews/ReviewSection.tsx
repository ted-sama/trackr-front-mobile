import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  useWindowDimensions,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import {
  useBookReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useMyBookReview,
} from "@/hooks/queries/reviews";
import { BookReview, ReviewSortOption } from "@/types/review";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { toast } from "sonner-native";
import { MessageSquare, ChevronDown, PenLine, ChevronRight, Trash2 } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { AxiosError } from "axios";
import { useRouter } from "expo-router";

interface ReviewSectionProps {
  bookId: string;
  preview?: boolean;
}

export default function ReviewSection({ bookId, preview = false }: ReviewSectionProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isBookTracked, getTrackedBookStatus } = useTrackedBooksStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [sortOption, setSortOption] = useState<ReviewSortOption>(
    preview ? "popular" : "recent",
  );
  const [editingReview, setEditingReview] = useState<BookReview | null>(null);

  const sortSheetRef = useRef<TrueSheet>(null);

  // Check user eligibility
  const isTracked = isBookTracked(bookId);
  const trackingStatus = getTrackedBookStatus(bookId);
  const hasRating = trackingStatus?.rating != null && trackingStatus.rating > 0;

  // Queries
  const {
    data: reviewsData,
    isLoading,
  } = useBookReviews(bookId, sortOption);

  // Get user's own review (dedicated endpoint)
  // myReview is: undefined (loading), null (no review), or BookReview (has review)
  const { data: myReview, isLoading: isLoadingMyReview } = useMyBookReview(isAuthenticated ? bookId : undefined);

  // Mutations
  const { mutateAsync: createReview, isPending: isCreating } =
    useCreateReview(bookId);
  const { mutateAsync: updateReview, isPending: isUpdating } = useUpdateReview(bookId);
  const { mutateAsync: deleteReview } = useDeleteReview(bookId);

  // Get reviews from response
  const reviews = useMemo(() => {
    return reviewsData?.reviews ?? [];
  }, [reviewsData]);

  // Only allow writing if: authenticated, tracked, rated, NOT loading myReview, myReview is explicitly null, AND not currently editing
  const canWriteReview = isAuthenticated && isTracked && hasRating && !isLoadingMyReview && myReview === null && !editingReview;

  // Animated values for sort button
  const sortScale = useSharedValue(1);
  const sortAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sortScale.value }],
  }));

  // Handlers
  const handleCreateReview = useCallback(
    async (content: string, isSpoiler: boolean) => {
      try {
        await createReview({ content, isSpoiler });
        toast.success(t("reviews.created"));
      } catch (error) {
        const axiosError = error as AxiosError<{ code?: string }>;
        const errorCode = axiosError.response?.data?.code;

        if (errorCode === "BOOK_NOT_TRACKED") {
          toast.error(t("reviews.errors.notTracked"));
        } else if (errorCode === "BOOK_NOT_RATED") {
          toast.error(t("reviews.errors.notRated"));
        } else if (errorCode === "REVIEW_ALREADY_EXISTS") {
          toast.error(t("reviews.errors.alreadyExists"));
        } else {
          toast.error(t("reviews.errors.createFailed"));
        }
      }
    },
    [createReview, t],
  );

  const handleUpdateReview = useCallback(
    async (content: string, isSpoiler: boolean) => {
      if (!editingReview) return;
      try {
        await updateReview({ reviewId: editingReview.id, dto: { content, isSpoiler } });
        setEditingReview(null);
        toast.success(t("reviews.updated"));
      } catch (error) {
        const axiosError = error as AxiosError<{ code?: string }>;
        const errorCode = axiosError.response?.data?.code;

        if (errorCode === "BOOK_NOT_RATED") {
          toast.error(t("reviews.errors.notRated"));
        } else if (errorCode === "REVIEW_NOT_FOUND") {
          toast.error(t("reviews.errors.notFound"));
        } else if (errorCode === "REVIEW_NOT_OWNED") {
          toast.error(t("reviews.errors.notOwned"));
        } else {
          toast.error(t("reviews.errors.updateFailed"));
        }
      }
    },
    [updateReview, editingReview, t],
  );

  const handleDeleteReview = useCallback(
    (reviewId: number) => {
      Alert.alert(
        t("reviews.deleteConfirmTitle"),
        t("reviews.deleteConfirmMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteReview(reviewId);
                toast.success(t("reviews.deleted"));
              } catch (error) {
                toast.error(t("reviews.errors.deleteFailed"));
              }
            },
          },
        ],
      );
    },
    [deleteReview, t],
  );

  const handleSortSelect = useCallback((option: ReviewSortOption) => {
    setSortOption(option);
    sortSheetRef.current?.dismiss();
  }, []);

  const handleSortPress = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("common.cancel"),
            t("reviews.sortRecent"),
            t("reviews.sortPopular"),
          ],
          cancelButtonIndex: 0,
          title: t("reviews.sortBy"),
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleSortSelect("recent");
          if (buttonIndex === 2) handleSortSelect("popular");
        },
      );
    } else {
      sortSheetRef.current?.present();
    }
  }, [t, handleSortSelect]);

  // Render eligibility message
  const renderEligibilityMessage = () => {
    if (!isAuthenticated) {
      return (
        <View
          style={[
            styles.eligibilityContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              typography.body,
              { color: colors.secondaryText, textAlign: "center" },
            ]}
          >
            {t("reviews.loginRequired")}
          </Text>
        </View>
      );
    }

    if (!isTracked) {
      return (
        <View
          style={[
            styles.eligibilityContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              typography.body,
              { color: colors.secondaryText, textAlign: "center" },
            ]}
          >
            {t("reviews.trackRequired")}
          </Text>
        </View>
      );
    }

    if (!hasRating) {
      return (
        <View
          style={[
            styles.eligibilityContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              typography.body,
              { color: colors.secondaryText, textAlign: "center" },
            ]}
          >
            {t("reviews.ratingRequired")}
          </Text>
        </View>
      );
    }

    return null;
  };

  const totalReviews = reviewsData?.total ?? 0;

  if (preview) {
    // Show user's review first, then the rest (excluding user's review from the list)
    const otherReviews = myReview
      ? reviews.filter((r: BookReview) => r.id !== myReview.id)
      : reviews;
    const previewReviews = myReview
      ? [myReview, ...otherReviews.slice(0, 9)]
      : otherReviews.slice(0, 10);
    const CARD_WIDTH = width - 32;

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MessageSquare size={20} color={colors.text} />
            <Text
              style={[
                typography.categoryTitle,
                { color: colors.text, marginLeft: 8 },
              ]}
            >
              {t("reviews.title")}
            </Text>
            {totalReviews > 0 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.secondaryText, marginLeft: 8 },
                ]}
              >
                ({totalReviews})
              </Text>
            )}
          </View>
        </View>

        {/* Reviews list or empty state */}
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                typography.body,
                { color: colors.secondaryText, textAlign: "center" },
              ]}
            >
              {t("reviews.empty")}
            </Text>
            {renderEligibilityMessage()}
          </View>
        ) : (
          <>
            <FlatList
              horizontal
              data={previewReviews}
              keyExtractor={(item) => item.id.toString()}
              snapToInterval={CARD_WIDTH + 12}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View style={{ width: CARD_WIDTH }}>
                  <ReviewCard
                    review={item}
                    bookId={bookId}
                  />
                </View>
              )}
            />

            <Pressable
              style={[styles.seeAllButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => router.push(`/book/${bookId}/reviews`)}
            >
              <Text style={[typography.body, { color: colors.text, fontWeight: "600" }]}>
                {t("reviews.seeAll")}
              </Text>
              <ChevronRight size={16} color={colors.text} />
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MessageSquare size={20} color={colors.text} />
          <Text
            style={[
              typography.categoryTitle,
              { color: colors.text, marginLeft: 8 },
            ]}
          >
            {t("reviews.title")}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.secondaryText, marginLeft: 8 },
            ]}
          >
            ({totalReviews})
          </Text>
        </View>

        {reviews.length > 0 && (
          <Animated.View style={sortAnimatedStyle}>
            <Pressable
              onPressIn={() => {
                sortScale.value = withTiming(0.95, { duration: 100 });
              }}
              onPressOut={() => {
                sortScale.value = withTiming(1, { duration: 100 });
              }}
              onPress={handleSortPress}
              style={[
                styles.sortButton,
                { backgroundColor: colors.actionButton },
              ]}
            >
              <Text style={[typography.caption, { color: colors.text }]}>
                {sortOption === "recent"
                  ? t("reviews.sortRecent")
                  : t("reviews.sortPopular")}
              </Text>
              <ChevronDown size={16} color={colors.text} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Form or eligibility message */}
      {/* Priority 1: If editing, always show edit form (most important to prevent race conditions) */}
      {editingReview ? (
        <View style={styles.formWrapper}>
          <Text
            style={[
              typography.caption,
              { color: colors.secondaryText, marginBottom: 8 },
            ]}
          >
            {t("reviews.editingReview")}
          </Text>
          <ReviewForm
            initialContent={editingReview.content}
            initialIsSpoiler={editingReview.isSpoiler}
            isEditing
            isSubmitting={isUpdating}
            onSubmit={handleUpdateReview}
            onCancel={() => setEditingReview(null)}
          />
        </View>
      ) : isLoadingMyReview && isAuthenticated && isTracked && hasRating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      ) : canWriteReview ? (
        <View style={styles.formWrapper}>
          <ReviewForm onSubmit={handleCreateReview} isSubmitting={isCreating} />
        </View>
      ) : myReview ? (
        <View style={styles.myReviewSection}>
          <View style={styles.myReviewHeader}>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {t("reviews.yourReview")}
            </Text>
            <View style={styles.myReviewActions}>
              <Pressable
                onPress={() => setEditingReview(myReview)}
                style={[
                  styles.editButton,
                  { backgroundColor: colors.actionButton },
                ]}
              >
                <PenLine size={14} color={colors.text} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text, marginLeft: 4 },
                  ]}
                >
                  {t("reviews.edit")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDeleteReview(myReview.id)}
                style={[
                  styles.editButton,
                  { backgroundColor: colors.actionButton },
                ]}
              >
                <Trash2 size={14} color={colors.error} />
              </Pressable>
            </View>
          </View>
          <ReviewCard
            review={myReview}
            bookId={bookId}
          />
        </View>
      ) : (
        renderEligibilityMessage()
      )}

      {/* Reviews list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              typography.body,
              { color: colors.secondaryText, textAlign: "center" },
            ]}
          >
            {t("reviews.empty")}
          </Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {reviews
            .filter((r: BookReview) => r.id !== myReview?.id)
            .map((review: BookReview) => (
              <ReviewCard
                key={review.id}
                review={review}
                bookId={bookId}
              />
            ))}
        </View>
      )}

      {/* Sort Bottom Sheet */}
      <TrueSheet
        ref={sortSheetRef}
        detents={["auto"]}
        cornerRadius={30}
        backgroundColor={colors.background}
        grabber={false}
      >
        <View style={styles.sortSheetContent}>
          <Text
            style={[typography.h2, { color: colors.text, marginBottom: 16 }]}
          >
            {t("reviews.sortBy")}
          </Text>
          <Pressable
            style={[
              styles.sortOption,
              {
                backgroundColor:
                  sortOption === "recent" ? colors.accent : colors.card,
              },
            ]}
            onPress={() => handleSortSelect("recent")}
          >
            <Text
              style={[
                typography.body,
                { color: sortOption === "recent" ? "#FFFFFF" : colors.text },
              ]}
            >
              {t("reviews.sortRecent")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.sortOption,
              {
                backgroundColor:
                  sortOption === "popular" ? colors.accent : colors.card,
              },
            ]}
            onPress={() => handleSortSelect("popular")}
          >
            <Text
              style={[
                typography.body,
                { color: sortOption === "popular" ? "#FFFFFF" : colors.text },
              ]}
            >
              {t("reviews.sortPopular")}
            </Text>
          </Pressable>
        </View>
      </TrueSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  formWrapper: {
    marginBottom: 16,
  },
  myReviewSection: {
    marginBottom: 16,
  },
  myReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  myReviewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  eligibilityContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 24,
  },
  reviewsList: {
    gap: 12,
  },
  loadMoreButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  sortSheetContent: {
    padding: 24,
  },
  sortOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
});
