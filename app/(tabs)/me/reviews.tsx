import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import ReviewPreviewCard from '@/components/reviews/ReviewPreviewCard';
import { useUserReviews } from '@/hooks/queries/reviews';
import { BookReview } from '@/types/review';
import { useUserStore } from '@/stores/userStore';
import { useTranslation } from 'react-i18next';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<BookReview>);

export default function UserReviewsScreen() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { currentUser } = useUserStore();
  const {
    data,
    isLoading,
    error,
  } = useUserReviews(currentUser?.username, 50);
  const [titleY, setTitleY] = useState<number>(0);
  const reviews = data?.reviews ?? [];

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleBack = () => {
    router.back();
  };

  const handleReviewPress = (review: BookReview) => {
    router.push(`/book/${review.bookId}/review/${review.id}`);
  };

  const renderItem = ({ item }: { item: BookReview }) => (
    <View style={styles.listItemContainer}>
      <ReviewPreviewCard
        review={item}
        onPress={() => handleReviewPress(item)}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.h3, { color: colors.secondaryText, textAlign: 'center' }]}>
        {t("profile.reviewsScreen.noReviews")}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.h3, { color: colors.error, textAlign: 'center' }]}>
        {t("error.title")}
      </Text>
      <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
        {t("error.subtitle")}
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t("profile.reviewsScreen.title", { username: currentUser?.displayName })}
        scrollY={scrollY}
        onBack={handleBack}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      {isLoading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <AnimatedFlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ marginTop: insets.top, paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
              <Text
                style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
                accessibilityRole="header"
                accessibilityLabel="Reviews"
                numberOfLines={1}
              >
                {t("profile.reviewsScreen.title", { username: currentUser?.displayName })}
              </Text>
            </View>
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 70 : 70,
    marginBottom: 16,
  },
  listItemContainer: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
