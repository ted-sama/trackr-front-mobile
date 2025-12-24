import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useChatUsage, BookChatUsage } from '@/hooks/queries/subscription';
import { useSubscription } from '@/contexts/SubscriptionContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import i18n from '@/i18n';

dayjs.extend(relativeTime);

function BookUsageItem({ item, colors, typography, onPress }: {
  item: BookChatUsage;
  colors: any;
  typography: any;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      dayjs.locale(i18n.language);
      return dayjs(dateString).fromNow();
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.bookItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.bookCover}>
        {item.book?.coverImage ? (
          <Image
            source={{ uri: item.book.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="book-outline" size={24} color={colors.secondaryText} />
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text
          style={[typography.body, { color: colors.text, fontWeight: '600' }]}
          numberOfLines={2}
        >
          {item.book?.title || `Book #${item.bookId}`}
        </Text>
        {item.lastUsedAt && (
          <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 2 }]}>
            {formatLastUsed(item.lastUsedAt)}
          </Text>
        )}
      </View>
      <View style={styles.usageStats}>
        <View style={styles.statRow}>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {t('chat.usage.thisMonth')}
          </Text>
          <Text style={[typography.body, { color: colors.accent, fontWeight: '600' }]}>
            {item.monthlyRequests}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {t('chat.usage.allTime')}
          </Text>
          <Text style={[typography.body, { color: colors.text, fontWeight: '500' }]}>
            {item.totalRequests}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatUsageScreen() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();
  const { isTrackrPlus, presentPaywall } = useSubscription();
  const { data: chatUsage, isLoading, error } = useChatUsage();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const formatResetDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  };

  const handleUpgrade = async () => {
    await presentPaywall();
  };

  const navigateToBook = (bookId: number) => {
    router.push(`/(zShared)/book/${bookId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            {t('error.subtitle')}
          </Text>
        </View>
      );
    }

    const summary = chatUsage?.summary;
    const books = chatUsage?.books || [];

    return (
      <>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="chatbubbles" size={28} color={colors.accent} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[typography.h2, { color: colors.text }]}>
                {summary?.remaining ?? 0}
              </Text>
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {t('chat.usage.remaining', { remaining: summary?.remaining ?? 0 })}
              </Text>
            </View>
          </View>

          <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.accent,
                  width: summary ? `${Math.min(100, (summary.used / summary.limit) * 100)}%` : '0%',
                },
              ]}
            />
          </View>

          <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 8 }]}>
            {t('chat.usage.used', { used: summary?.used ?? 0, limit: summary?.limit ?? 0 })}
          </Text>

          {summary?.resetsAt && (
            <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
              {t('chat.usage.resetsOn', { date: formatResetDate(summary.resetsAt) })}
            </Text>
          )}

          {!isTrackrPlus && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
              onPress={handleUpgrade}
            >
              <Ionicons name="star" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>
                {t('chat.usage.unlimitedHint')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Books List */}
        <Text style={[typography.h3, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>
          {t('chat.usage.booksUsed')}
        </Text>

        {books.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.secondaryText} />
            <Text style={[typography.body, { color: colors.text, marginTop: 16, fontWeight: '600' }]}>
              {t('chat.usage.noBooksYet')}
            </Text>
            <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4, textAlign: 'center' }]}>
              {t('chat.usage.noBooksHint')}
            </Text>
          </View>
        ) : (
          <View style={styles.booksList}>
            {books.map((item) => (
              <BookUsageItem
                key={item.bookId}
                item={item}
                colors={colors}
                typography={typography}
                onPress={() => navigateToBook(item.bookId)}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      <AnimatedHeader
        title={t('chat.usage.title')}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 64,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
          <Text style={[typography.h1, { color: colors.text }]}>
            {t('chat.usage.title')}
          </Text>
        </View>

        {renderContent()}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 70,
    marginBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    marginLeft: 16,
    flex: 1,
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  booksList: {
    gap: 12,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  bookCover: {
    width: 48,
    height: 72,
    borderRadius: 6,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  usageStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
