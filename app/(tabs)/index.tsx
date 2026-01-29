import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { router } from "expo-router";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import BookListElement from "@/components/BookListElement";
import CategorySlider from "@/components/CategorySlider";
import { useMostTrackedCategory, useTopRatedCategory } from "@/hooks/queries/categories";
import { usePopularAmongFollowing, useRecentlyRatedByFollowing } from "@/hooks/queries/feed";
import { usePinnedBookWithProgress, useUnpinBook } from "@/hooks/queries/pinnedBook";
import { useSubscriptionInfo } from "@/hooks/queries/subscription";
import RecentlyRatedSlider from "@/components/home/RecentlyRatedSlider";
import { ChevronRight, Sparkles } from "lucide-react-native";
import { useAnimatedStyle, useSharedValue, withTiming, useAnimatedScrollHandler } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import { HomeAnimatedHeader } from "@/components/home/HomeAnimatedHeader";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorState } from "@/components/ErrorState";
import PinnedBookCard from "@/components/book/PinnedBookCard";

const AnimatedScrollView = Animated.createAnimatedComponent(Animated.ScrollView);

export default function Index() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const scrollY = useSharedValue(0);

  // Subscribe to trackedBooks state directly so the component re-renders when it changes
  const trackedBooks = useTrackedBooksStore((state) => state.trackedBooks);
  const { data: mostTracked, isLoading: isLoadingMostTracked, error: errorMostTracked, refetch: refetchMostTracked } = useMostTrackedCategory();
  const { data: topRated, isLoading: isLoadingTopRated, error: errorTopRated, refetch: refetchTopRated } = useTopRatedCategory();
  const { data: popularAmongFollowing } = usePopularAmongFollowing();
  const { data: recentlyRated } = useRecentlyRatedByFollowing();

  // Trackr Plus subscription check
  const { data: subscriptionData } = useSubscriptionInfo();
  const isPlus = subscriptionData?.isPremium;

  // Pinned book data (only for Plus users)
  const { data: pinnedData, isLoading: isLoadingPinned } = usePinnedBookWithProgress();
  const unpinBook = useUnpinBook();

  const isLoading = isLoadingMostTracked || isLoadingTopRated;
  const error = errorMostTracked || errorTopRated;
  const refetch = () => {
    refetchMostTracked();
    refetchTopRated();
  };

  const lastRead = React.useMemo(() => {
    const booksArray = Object.values(trackedBooks).filter(book => book && book.id);
    return booksArray.filter(book => book.trackingStatus?.currentChapter && book.trackingStatus?.lastReadAt !== null).sort((a, b) => {
      if (a.trackingStatus?.lastReadAt && b.trackingStatus?.lastReadAt) {
        return new Date(b.trackingStatus.lastReadAt).getTime() - new Date(a.trackingStatus.lastReadAt).getTime();
      }
      return 0;
    }).slice(0, 3);
  }, [trackedBooks]);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 220 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 220 });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  if (isLoading) {
    return (
      <ScreenWrapper>
      <SafeAreaView
        edges={["right", "left"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <HomeAnimatedHeader scrollY={scrollY} />
        <AnimatedScrollView
          style={{ flex: 1 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.content}>
            {/* Last Read section skeleton */}
            <View style={styles.lastReadContainer}>
              <SkeletonLoader width={120} height={20} style={{ marginBottom: 16 }} />
              {[1, 2, 3].map((item) => (
                <View key={item} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <SkeletonLoader width={40} height={60} style={{ borderRadius: 4 }} />
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                      <View>
                        <SkeletonLoader width="80%" height={16} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width="60%" height={12} style={{ marginBottom: 4 }} />
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          <SkeletonLoader width={60} height={20} style={{ borderRadius: 10 }} />
                          <SkeletonLoader width={40} height={20} style={{ borderRadius: 10 }} />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <SkeletonLoader width={140} height={16} style={{ marginTop: 22, alignSelf: "center" }} />
            </View>

            {/* Category sliders skeleton */}
            <View style={{ marginHorizontal: -16, marginTop: 20 }}>
              <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                <SkeletonLoader width={180} height={20} />
              </View>
              <View style={{ flexDirection: "row", paddingLeft: 16 }}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={{ marginRight: 12 }}>
                    <SkeletonLoader width={110} height={165} style={{ borderRadius: 6, marginBottom: 8 }} />
                    <SkeletonLoader width={100} height={14} style={{ marginBottom: 4 }} />
                    <SkeletonLoader width={80} height={12} />
                  </View>
                ))}
              </View>
            </View>

            <View style={{ marginHorizontal: -16, marginTop: 20 }}>
              <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                <SkeletonLoader width={180} height={20} />
              </View>
              <View style={{ flexDirection: "row", paddingLeft: 16 }}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={{ marginRight: 12 }}>
                    <SkeletonLoader width={110} height={165} style={{ borderRadius: 6, marginBottom: 8 }} />
                    <SkeletonLoader width={100} height={14} style={{ marginBottom: 4 }} />
                    <SkeletonLoader width={80} height={12} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </AnimatedScrollView>
      </SafeAreaView>
      </ScreenWrapper>
    );
  }

  if (error && !isLoading) {
    return (
      <ScreenWrapper>
      <SafeAreaView
        edges={["right", "left"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
    <SafeAreaView
      edges={["right", "left"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <HomeAnimatedHeader scrollY={scrollY} />
      <AnimatedScrollView
        style={{ flex: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
      <View style={styles.content}>
        {/* Pinned Book Card (Trackr Plus only) */}
        {isPlus && !isLoadingPinned && (
          <View style={styles.pinnedBookContainer}>
            {pinnedData?.pinnedBook ? (
              <PinnedBookCard
                pinnedBook={pinnedData.pinnedBook}
                progress={pinnedData.progress}
                onUnpin={() => unpinBook.mutate()}
              />
            ) : (
              <View style={styles.noPinnedBookCard}>
                <View style={styles.noPinnedBookIcon}>
                  <Sparkles size={32} color={colors.accent} fill={colors.accent} />
                </View>
                <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                  {t('pinnedBook.noPinnedBook')}
                </Text>
                <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 4 }]}>
                  {t('pinnedBook.tapToPin')}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.lastReadContainer}>
          <Text style={[typography.categoryTitle, { color: colors.text, marginBottom: 16 }]}>{t("home.lastRead")}</Text>
          {lastRead.length > 0 ? (
            <FlatList
              data={lastRead}
              renderItem={({ item }) => <BookListElement book={item} compact showTrackingStatus showTrackingChapter onPress={() => {router.push(`/book/${item.id}`)}} />}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[typography.bodyBold, { color: colors.secondaryText, textAlign: "center" }]}>{t("home.noLastRead")}</Text>
          )}
          <Animated.View style={animatedStyle}>
            <Pressable 
              style={{flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 22 }} 
              onPress={() => router.push("/collection/my-library")}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[typography.h3, { color: colors.accent }]}>{t("home.goToLibrary")}</Text>
              <ChevronRight size={16} strokeWidth={2.5} color={colors.accent} opacity={0.8} />
            </Pressable>
          </Animated.View>
        </View>
        {recentlyRated && recentlyRated.length > 0 && (
          <View style={{ marginHorizontal: -16 }}>
            <RecentlyRatedSlider items={recentlyRated} />
          </View>
        )}
        {popularAmongFollowing && popularAmongFollowing.books && popularAmongFollowing.books.length > 0 && (
          <View style={{ marginHorizontal: -16 }}>
            <CategorySlider category={popularAmongFollowing} seeMore={false} />
          </View>
        )}
        <View style={{ marginHorizontal: -16 }}>
          {mostTracked && (
            <CategorySlider category={mostTracked} seeMore={false} />
          )}
        </View>
        <View style={{ marginHorizontal: -16 }}>
          {topRated && (
              <CategorySlider category={topRated} seeMore={false} />
          )}
          </View>
        </View>
      </AnimatedScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 140,
    paddingHorizontal: 16,
    paddingBottom: 78,
  },
  lastReadContainer: {
    flexDirection: "column",
    marginBottom: 20,
  },
  pinnedBookContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  noPinnedBookCard: {
    width: width - 32,
    paddingVertical: 32,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  noPinnedBookIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
