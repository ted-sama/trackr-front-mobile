import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { RecentlyRatedItem } from '@/types/feed';
import { MessageSquare } from 'lucide-react-native';
import StarRating from '@/components/ui/StarRating';

interface RecentlyRatedSliderProps {
  items: RecentlyRatedItem[];
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;
const CARD_HEIGHT = CARD_WIDTH * 1.5 + 70;

interface RecentlyRatedCardProps {
  item: RecentlyRatedItem;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RecentlyRatedCard({ item }: RecentlyRatedCardProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (item.hasReview && item.reviewId) {
      // Navigate to review
      router.push({
        pathname: '/book/[id]/review/[reviewId]',
        params: { id: item.book.id, reviewId: item.reviewId },
      });
    } else {
      // Navigate to book
      router.push({
        pathname: '/book/[id]',
        params: { id: item.book.id },
      });
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      {/* Book Cover */}
      <View style={styles.coverContainer}>
        {item.book.coverImage ? (
          <Image
            source={{ uri: item.book.coverImage }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.cover, { backgroundColor: colors.border }]} />
        )}
      </View>

      {/* User info and rating */}
      <View style={styles.infoContainer}>
        <Pressable
          style={styles.userRow}
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user.username } })}
        >
          <Avatar image={item.user.avatar ?? undefined} size={24} />
          <Text
            style={[typography.caption, { color: colors.text, flex: 1, marginLeft: 8 }]}
            numberOfLines={1}
          >
            {item.user.displayName || item.user.username}
          </Text>
        </Pressable>
        <View style={styles.ratingRow}>
          <StarRating rating={item.rating} size={12} color={colors.secondaryText} />
          {item.hasReview && (
            <MessageSquare size={12} color={colors.secondaryText} fill={colors.secondaryText} style={{ marginLeft: 6 }} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function RecentlyRatedSlider({ items }: RecentlyRatedSliderProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.categoryTitle, { color: colors.text }]}>
          {t('home.recentlyRatedByFollowing')}
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.book.id}-${item.user.id}-${index}`}
        renderItem={({ item }) => <RecentlyRatedCard item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sliderContent}
        style={{ height: CARD_HEIGHT }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sliderContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
  },
  coverContainer: {
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  infoContainer: {
    marginTop: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
