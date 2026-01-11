import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ListRenderItem,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowUpDown,
  Heart,
  Clock,
  Star,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { TrueSheet } from "@lodev09/react-native-true-sheet";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useBookReviews, useToggleReviewLike } from "@/hooks/queries/reviews";
import { ReviewSortOption, BookReview } from "@/types/review";
import { ReviewCard } from "@/components/reviews";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import LikeButton from "@/components/ui/LikeButton";
import { useUserStore } from "@/stores/userStore";

interface SortOptionConfig {
  key: ReviewSortOption;
  label: string;
  icon: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SortButtonProps {
  option: SortOptionConfig;
  isSelected: boolean;
  onPress: () => void;
  typography: ReturnType<typeof useTypography>;
  colors: ReturnType<typeof useTheme>['colors'];
}

const SortButton = ({ option, isSelected, onPress, typography, colors }: SortButtonProps) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(128, 128, 128, ${pressed.value * 0.15})`,
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 100 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 200 });
      }}
      onPress={onPress}
      style={[styles.sortOptionButton, animatedStyle]}
    >
      <View style={styles.sortOptionContent}>
        {option.icon}
        <Text
          style={[
            typography.h3,
            { color: colors.text, flex: 1 },
          ]}
        >
          {option.label}
        </Text>
      </View>
      {isSelected && (
        <Check size={20} strokeWidth={2.75} color={colors.accent} />
      )}
    </AnimatedPressable>
  );
};

export default function AllReviewsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState(0);

  const [sortOption, setSortOption] = useState<ReviewSortOption>("popular");
  const [refreshing, setRefreshing] = useState(false);
  const sortSheetRef = useRef<TrueSheet>(null);

  const bookId = id as string;
  const { data, isLoading, refetch } = useBookReviews(
    bookId,
    sortOption,
    50
  );
  const { currentUser } = useUserStore();
  const { mutate: toggleLike } = useToggleReviewLike(bookId);

  const sortOptions: SortOptionConfig[] = useMemo(() => [
    { 
      key: "popular", 
      label: t("reviews.sort.popular"),
      icon: <Heart size={18} color={colors.text} />,
    },
    { 
      key: "recent", 
      label: t("reviews.sort.recent"),
      icon: <Clock size={18} color={colors.text} />,
    },
    { 
      key: "highest_rated", 
      label: t("reviews.sort.highestRated"),
      icon: <Star size={18} color={colors.text} />,
    },
    { 
      key: "lowest_rated", 
      label: t("reviews.sort.lowestRated"),
      icon: <Star size={18} color={colors.text} />,
    },
  ], [t, colors.text, colors.secondaryText]);

  const currentSortLabel = sortOptions.find((o) => o.key === sortOption)?.label;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleOpenSort = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sortSheetRef.current?.present();
  }, []);

  const handleSortSelect = useCallback((key: ReviewSortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortOption(key);
    sortSheetRef.current?.dismiss();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLikePress = useCallback((reviewId: number, isLiked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike({ reviewId, isLiked });
  }, [toggleLike]);

  const handleReviewPress = useCallback((reviewId: number) => {
    router.push(`/book/${bookId}/review/${reviewId}`);
  }, [router, bookId]);

  const renderReviewItem: ListRenderItem<BookReview> = useCallback(
    ({ item }) => {
      const isOwnReview = currentUser?.id === item.userId;
      
      return (
        <View style={styles.reviewItemContainer}>
          <ReviewCard 
            review={item} 
            bookId={bookId} 
            variant="compact"
            onPress={() => handleReviewPress(item.id)}
          />
          <View style={styles.likeButtonContainer}>
            <LikeButton
              isLiked={item.isLikedByMe}
              count={item.likesCount}
              onPress={() => handleLikePress(item.id, item.isLikedByMe)}
              disabled={isOwnReview}
            />
          </View>
        </View>
      );
    },
    [bookId, currentUser?.id, handleLikePress, handleReviewPress]
  );

  const keyExtractor = useCallback((item: BookReview) => item.id.toString(), []);

  const ListHeader = useMemo(() => (
    <View 
      style={styles.listHeader} 
      onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
    >
      <Text style={[typography.h1, { color: colors.text }]}>
        {t("reviews.title")}
      </Text>
      {data?.total !== undefined && data.total > 0 && (
        <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
          {data.total} {data.total === 1 ? t("common.review") : t("common.reviews")}
        </Text>
      )}
    </View>
  ), [typography, colors, t, data?.total, currentSortLabel, handleOpenSort]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader
              key={i}
              width="100%"
              height={180}
              style={{ borderRadius: 16, marginBottom: 16 }}
            />
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>
          {t("reviews.noReviews")}
        </Text>
      </View>
    );
  }, [isLoading, typography, colors, t]);

  const ListFooter = useMemo(() => {
    return null;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t("reviews.title")}
        subtitle={data?.total !== undefined && data.total > 0 ? `${data.total} ${data.total === 1 ? t("common.review") : t("common.reviews")}` : undefined}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        rightButtonIcon={<ArrowUpDown size={22} color={colors.icon} />}
        onRightButtonPress={handleOpenSort}
      />

      <Animated.FlatList
        data={data?.reviews}
        renderItem={renderReviewItem}
        keyExtractor={keyExtractor}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 64,
          paddingHorizontal: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={insets.top}
          />
        }
      />

      {/* Sort Bottom Sheet */}
      <TrueSheet
        ref={sortSheetRef}
        detents={["auto"]}
        backgroundColor={colors.background}
        grabber={false}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={[typography.categoryTitle, { color: colors.text }]}>
              {t("reviews.sortBy")}
            </Text>
          </View>

          <View style={styles.sortOptions}>
            {sortOptions.map((option) => (
              <SortButton
                key={option.key}
                option={option}
                isSelected={sortOption === option.key}
                onPress={() => handleSortSelect(option.key)}
                typography={typography}
                colors={colors}
              />
            ))}
          </View>
        </View>
      </TrueSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    marginTop: 70,
    marginBottom: 16,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  reviewItemContainer: {
    marginVertical: 12,
  },
  likeButtonContainer: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  loadingContainer: {
    paddingTop: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  sortOptions: {
    gap: 4,
  },
  sortOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  sortOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
});
