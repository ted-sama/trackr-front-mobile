import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, FlatList } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { RecentlyRatedItem } from '@/types/feed';
import { MessageSquare } from 'lucide-react-native';
import StarRating from '@/components/ui/StarRating';
import BookCard from '@/components/BookCard';
import { Book } from '@/types/book';

interface RecentlyRatedSliderProps {
  items: RecentlyRatedItem[];
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;
const CARD_HEIGHT = CARD_WIDTH * 1.5 + 70;

interface RecentlyRatedCardInfoProps {
  item: RecentlyRatedItem;
}

function RecentlyRatedCardInfo({ item }: RecentlyRatedCardInfoProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <>
      <Pressable
        style={styles.userRow}
        onPress={() => router.push({ pathname: '/profile/[userId]', params: { userId: item.user.username } })}
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
    </>
  );
}

export default function RecentlyRatedSlider({ items }: RecentlyRatedSliderProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return null;
  }

  const handlePress = (item: RecentlyRatedItem) => {
    if (item.hasReview && item.reviewId) {
      router.push({
        pathname: '/book/[id]/review/[reviewId]',
        params: { id: item.book.id, reviewId: item.reviewId },
      });
    } else {
      router.push({
        pathname: '/book/[id]',
        params: { id: item.book.id },
      });
    }
  };

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
        renderItem={({ item }) => (
          <BookCard
            book={item.book as Book}
            onPress={() => handlePress(item)}
            showTitle={false}
            showAuthor={false}
            showRating={false}
            showTrackingButton={false}
            customInfo={<RecentlyRatedCardInfo item={item} />}
          />
        )}
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
