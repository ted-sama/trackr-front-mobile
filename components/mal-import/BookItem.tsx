import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { PendingImportBook } from '@/hooks/queries/malImport';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  GRID_BORDER_RADIUS,
  GRID_BORDER_WIDTH,
} from './constants';

const DEFAULT_COVER_COLOR = '#6B7280';

interface BookItemProps {
  book: PendingImportBook;
  isSelected: boolean;
  onToggle: (bookId: number) => void;
  viewMode: 'grid' | 'list';
}

export function BookItem({ book, isSelected, onToggle, viewMode }: BookItemProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const translatedStatus = useMemo(() => {
    const statusMap: Record<string, string> = {
      plan_to_read: t('status.planToRead'),
      reading: t('status.reading'),
      completed: t('status.completed'),
      on_hold: t('status.onHold'),
      dropped: t('status.dropped'),
    };
    return statusMap[book.status] ?? book.status;
  }, [book.status, t]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(book.bookId);
  };

  if (viewMode === 'list') {
    return (
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: 220 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 220 });
        }}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.listItem,
            { backgroundColor: colors.card, borderColor: isSelected ? colors.accent : colors.border },
            animatedStyle,
          ]}
        >
          <View style={[styles.listCover, { backgroundColor: DEFAULT_COVER_COLOR }]}>
            {book.coverImage ? (
              <Image source={{ uri: book.coverImage }} style={styles.listCoverImage} cachePolicy="memory-disk" />
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>📚</Text>
            )}
          </View>
          <View style={styles.listInfo}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {translatedStatus} {book.currentChapter ? `• Ch. ${book.currentChapter}` : ''}
            </Text>
          </View>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: isSelected ? colors.accent : 'transparent',
                borderColor: isSelected ? colors.accent : colors.border,
              },
            ]}
          >
            {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 220 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 220 });
      }}
      onPress={handlePress}
    >
      <Animated.View style={[styles.gridCard, animatedStyle]}>
        <View
          style={[
            styles.gridCover,
            {
              backgroundColor: colors.card,
              borderColor: isSelected ? colors.accent : 'transparent',
              borderWidth: GRID_BORDER_WIDTH,
            },
          ]}
        >
          <View style={styles.gridCoverInner}>
            {book.coverImage ? (
              <Image source={{ uri: book.coverImage }} style={styles.gridCoverImage} cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.noCover, { backgroundColor: DEFAULT_COVER_COLOR }]}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }}>📚</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.gridCheckbox,
              {
                backgroundColor: isSelected ? colors.accent : 'rgba(0,0,0,0.5)',
                borderColor: isSelected ? colors.accent : 'transparent',
              },
            ]}
          >
            {isSelected ? (
              <Check size={12} color="#fff" strokeWidth={3} />
            ) : (
              <View style={styles.uncheckedCircle} />
            )}
          </View>
        </View>
        <Text style={[typography.caption, { color: colors.text, marginTop: 4 }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 2 }]} numberOfLines={1}>
          {translatedStatus} {book.currentChapter ? `• Ch. ${book.currentChapter}` : ''}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: CARD_WIDTH,
  },
  gridCover: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: GRID_BORDER_RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  gridCoverInner: {
    flex: 1,
    borderRadius: GRID_BORDER_RADIUS - GRID_BORDER_WIDTH,
    overflow: 'hidden',
  },
  gridCoverImage: {
    width: '100%',
    height: '100%',
  },
  gridCheckbox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  uncheckedCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  noCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  listCover: {
    width: 50,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCoverImage: {
    width: '100%',
    height: '100%',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
