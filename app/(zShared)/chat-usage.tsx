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
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

dayjs.extend(relativeTime);

const CIRCLE_SIZE = 120;
const STROKE_WIDTH = 10;

function CircularProgress({
  progress,
  remaining,
  accentColor,
  backgroundColor,
  textColor,
  secondaryTextColor,
  t,
}: {
  progress: number;
  remaining: number;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  t: (key: string) => string;
}) {
  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const center = CIRCLE_SIZE / 2;

  const backgroundPath = Skia.Path.Make();
  backgroundPath.addCircle(center, center, radius);

  const progressPath = Skia.Path.Make();
  const startAngle = -90;
  const sweepAngle = 360 * Math.min(1, Math.max(0, 1 - progress));
  progressPath.addArc(
    { x: STROKE_WIDTH / 2, y: STROKE_WIDTH / 2, width: CIRCLE_SIZE - STROKE_WIDTH, height: CIRCLE_SIZE - STROKE_WIDTH },
    startAngle,
    sweepAngle
  );

  return (
    <View style={styles.circularContainer}>
      <Canvas style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <Path
          path={backgroundPath}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          color={backgroundColor}
          strokeCap="round"
        />
        <Path
          path={progressPath}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          color={accentColor}
          strokeCap="round"
        />
      </Canvas>
      <View style={styles.circularTextContainer}>
        <Text style={[styles.circularValue, { color: textColor }]}>
          {remaining}
        </Text>
        <Text style={[styles.circularLabel, { color: secondaryTextColor }]}>
          {t('chat.usage.remainingShort')}
        </Text>
      </View>
    </View>
  );
}

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
        <View style={styles.summaryCard}>
          <CircularProgress
            progress={summary ? summary.used / summary.limit : 0}
            remaining={summary?.remaining ?? 0}
            accentColor={colors.accent}
            backgroundColor={colors.border}
            textColor={colors.text}
            secondaryTextColor={colors.secondaryText}
            t={t}
          />

          <View style={styles.summaryDetails}>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {t('chat.usage.used', { used: summary?.used ?? 0, limit: summary?.limit ?? 0 })}
            </Text>

            {summary?.resetsAt && (
              <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
                {t('chat.usage.resetsOn', { date: formatResetDate(summary.resetsAt) })}
              </Text>
            )}
          </View>

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
    alignItems: 'center',
  },
  circularContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  circularLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    marginTop: 2,
  },
  summaryDetails: {
    marginTop: 16,
    alignItems: 'center',
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
