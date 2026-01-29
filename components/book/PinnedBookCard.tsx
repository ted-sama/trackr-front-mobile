import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BookOpenIcon, PinIcon, Sparkles } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { PinnedBook, ReadingProgress } from '@/hooks/queries/pinnedBook';
import PlusBadge from '@/components/ui/PlusBadge';
import { router } from 'expo-router';

interface PinnedBookCardProps {
  pinnedBook: PinnedBook;
  progress?: ReadingProgress | null;
  onPress?: () => void;
  onUnpin?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 160;
const COVER_WIDTH = 100;
const COVER_HEIGHT = CARD_HEIGHT - 24;

export default function PinnedBookCard({
  pinnedBook,
  progress,
  onPress,
  onUnpin,
}: PinnedBookCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();

  // Generate gradient colors from dominant color
  const gradientColors = useMemo(() => {
    if (pinnedBook.book?.dominantColor) {
      return [
        pinnedBook.book.dominantColor + 'CC', // 80% opacity
        pinnedBook.book.dominantColor + '99', // 60% opacity
        pinnedBook.book.dominantColor + '33', // 20% opacity
        colors.card,
      ];
    }
    return [
      colors.accent + 'CC',
      colors.accent + '99',
      colors.accent + '33',
      colors.card,
    ];
  }, [pinnedBook.book?.dominantColor, colors.accent, colors.card]);

  // Calculate progress percentage
  const progressPercentage = progress?.progressPercentage ?? 0;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 220 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 220 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
    if (pinnedBook.book?.id) {
      router.push(`/book/${pinnedBook.book.id}`);
    }
  };

  const handleUnpin = (e: any) => {
    e.stopPropagation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUnpin?.();
  };

  const authorsText = pinnedBook.book?.authors
    ?.map((a) => a.name)
    .join(', ');

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.container}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Book Cover */}
          <View style={styles.coverContainer}>
            {pinnedBook.book?.coverImage ? (
              <Image
                source={{ uri: pinnedBook.book.coverImage }}
                style={styles.cover}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.noCover, { backgroundColor: colors.card }]}>
                <BookOpenIcon size={32} color={colors.secondaryText} />
              </View>
            )}
          </View>

          {/* Book Info */}
          <View style={styles.infoContainer}>
            {/* Header with Plus badge and pin status */}
            <View style={styles.header}>
              <PlusBadge />
              <View style={styles.pinIndicator}>
                <PinIcon size={12} color="white" fill="white" />
                <Text style={[typography.caption, { color: 'white', marginLeft: 4 }]}>
                  {t('pinnedBook.pinned')}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              style={[typography.h3, styles.title, { color: 'white' }]}
              numberOfLines={2}
            >
              {pinnedBook.book?.title || 'Untitled'}
            </Text>

            {/* Author */}
            {authorsText && (
              <Text
                style={[typography.body, styles.author, { color: 'rgba(255,255,255,0.8)' }]}
                numberOfLines={1}
              >
                {authorsText}
              </Text>
            )}

            {/* Reading Progress */}
            {progress && progress.status === 'reading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercentage}%`, backgroundColor: 'white' },
                    ]}
                  />
                </View>
                <Text
                  style={[typography.caption, { color: 'rgba(255,255,255,0.7)', marginTop: 4 }]}
                >
                  {progress.currentChapter}/{pinnedBook.book?.totalChapters || '?'} {'• '}
                  {progressPercentage}%
                </Text>
              </View>
            )}

            {/* AI Summary indicator */}
            {pinnedBook.summary && (
              <View style={styles.aiSummaryContainer}>
                <Sparkles size={12} color="white" fill="white" />
                <Text
                  style={[typography.caption, { color: 'white', marginLeft: 4, flex: 1 }]}
                  numberOfLines={2}
                >
                  {pinnedBook.summary}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Unpin button (top right) */}
        <Pressable
          style={[styles.unpinButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={handleUnpin}
        >
          <PinIcon size={16} color="white" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  coverContainer: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pinIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  title: {
    marginBottom: 4,
    fontSize: 18,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  aiSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  unpinButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
