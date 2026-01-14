import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import {
  PlusIcon,
  MinusIcon,
  HeartIcon,
  HeartOffIcon,
  BookCheck,
  BookOpenIcon,
  StarIcon,
  MessageSquareIcon,
  MessageSquarePlusIcon,
  MessageSquareXIcon,
  Check,
} from 'lucide-react-native';

export type ActivityActionType =
  | 'book.addedToLibrary'
  | 'book.removedFromLibrary'
  | 'book.addedToFavorites'
  | 'book.removedFromFavorites'
  | 'book.statusUpdated'
  | 'book.currentChapterUpdated'
  | 'book.ratingUpdated'
  | 'book.reviewCreated'
  | 'book.reviewUpdated'
  | 'book.reviewDeleted';

export const ALL_ACTION_TYPES: ActivityActionType[] = [
  'book.addedToLibrary',
  'book.removedFromLibrary',
  'book.addedToFavorites',
  'book.removedFromFavorites',
  'book.statusUpdated',
  'book.currentChapterUpdated',
  'book.ratingUpdated',
  'book.reviewCreated',
  'book.reviewUpdated',
  'book.reviewDeleted',
];

export interface ActivityActionFilterBottomSheetProps {
  onActionsChange: (actions: ActivityActionType[]) => void;
  currentActions: ActivityActionType[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionOptionProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTypography>;
}

const ActionOption = ({
  label,
  icon,
  isSelected,
  onPress,
  colors,
  typography,
}: ActionOptionProps) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(128, 128, 128, ${pressed.value * 0.15})`,
  }));

  return (
    <View style={styles.actionButtonWrapper}>
      <AnimatedPressable
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 100 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 200 });
        }}
        onPress={onPress}
        style={[styles.actionButton, animatedStyle]}
      >
        <View style={styles.actionButtonContent}>
          {icon}
          <Text
            style={[typography.h3, { color: colors.text, flex: 1 }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        {isSelected && (
          <Check size={20} strokeWidth={2.75} color={colors.accent} />
        )}
      </AnimatedPressable>
    </View>
  );
};

const ActivityActionFilterBottomSheet = forwardRef<
  TrueSheet,
  ActivityActionFilterBottomSheetProps
>(({ onActionsChange, currentActions }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();

  // Local state for pending selection
  const [selectedActions, setSelectedActions] =
    useState<ActivityActionType[]>(currentActions);

  // Button animations
  const resetScale = useSharedValue(1);
  const applyScale = useSharedValue(1);

  const resetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resetScale.value }],
  }));

  const applyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: applyScale.value }],
  }));

  // Sync local state when sheet opens with current props
  useEffect(() => {
    setSelectedActions(currentActions);
  }, [currentActions]);

  const actionOptions: {
    value: ActivityActionType;
    labelKey: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'book.addedToLibrary',
      labelKey: 'activity.filters.actions.addedToLibrary',
      icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.removedFromLibrary',
      labelKey: 'activity.filters.actions.removedFromLibrary',
      icon: <MinusIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.addedToFavorites',
      labelKey: 'activity.filters.actions.addedToFavorites',
      icon: <HeartIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.removedFromFavorites',
      labelKey: 'activity.filters.actions.removedFromFavorites',
      icon: <HeartOffIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.statusUpdated',
      labelKey: 'activity.filters.actions.statusUpdated',
      icon: <BookCheck size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.currentChapterUpdated',
      labelKey: 'activity.filters.actions.chapterUpdated',
      icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.ratingUpdated',
      labelKey: 'activity.filters.actions.ratingUpdated',
      icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.reviewCreated',
      labelKey: 'activity.filters.actions.reviewCreated',
      icon: <MessageSquarePlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.reviewUpdated',
      labelKey: 'activity.filters.actions.reviewUpdated',
      icon: <MessageSquareIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'book.reviewDeleted',
      labelKey: 'activity.filters.actions.reviewDeleted',
      icon: <MessageSquareXIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
  ];

  const toggleAction = useCallback((action: ActivityActionType) => {
    Haptics.selectionAsync();
    setSelectedActions((prev) => {
      if (prev.includes(action)) {
        return prev.filter((a) => a !== action);
      }
      return [...prev, action];
    });
  }, []);

  const handleApply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionsChange(selectedActions);
    const sheetRef = typeof ref === 'object' ? ref?.current : null;
    if (sheetRef) {
      sheetRef.dismiss();
    }
  }, [selectedActions, onActionsChange, ref]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActions([]);
    onActionsChange([]);
    const sheetRef = typeof ref === 'object' ? ref?.current : null;
    if (sheetRef) {
      sheetRef.dismiss();
    }
  }, [onActionsChange, ref]);

  return (
    <TrueSheet
      ref={ref}
      detents={['auto']}
      backgroundColor={colors.background}
      grabber={false}
    >
      <View style={styles.bottomSheetContent}>
        <View style={styles.header}>
          <Text style={[typography.categoryTitle, { color: colors.text }]}>
            {t('activity.filters.actions.title')}
          </Text>
        </View>

        <View style={styles.actionOptions}>
          {actionOptions.map((option) => (
            <ActionOption
              key={option.value}
              label={t(option.labelKey)}
              icon={option.icon}
              isSelected={selectedActions.includes(option.value)}
              onPress={() => toggleAction(option.value)}
              colors={colors}
              typography={typography}
            />
          ))}
        </View>

        <View style={styles.footer}>
          {/* Reset button */}
          <AnimatedPressable
            onPressIn={() => {
              resetScale.value = withTiming(0.97, { duration: 100 });
            }}
            onPressOut={() => {
              resetScale.value = withTiming(1, { duration: 100 });
            }}
            onPress={handleReset}
            disabled={selectedActions.length === 0}
            style={[
              styles.footerButton,
              {
                backgroundColor: colors.actionButton,
                opacity: selectedActions.length === 0 ? 0.5 : 1,
              },
              resetAnimatedStyle,
            ]}
          >
            <Text style={[typography.bodyBold, { color: colors.text }]}>
              {t('activity.filters.actions.reset')}
            </Text>
          </AnimatedPressable>

          {/* Apply button */}
          <AnimatedPressable
            onPressIn={() => {
              applyScale.value = withTiming(0.97, { duration: 100 });
            }}
            onPressOut={() => {
              applyScale.value = withTiming(1, { duration: 100 });
            }}
            onPress={handleApply}
            style={[
              styles.footerButton,
              { backgroundColor: colors.accent },
              applyAnimatedStyle,
            ]}
          >
            <Text style={[typography.bodyBold, { color: '#fff' }]}>
              {t('activity.filters.actions.apply')}
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </TrueSheet>
  );
});

ActivityActionFilterBottomSheet.displayName = 'ActivityActionFilterBottomSheet';

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  actionOptions: {
    flexDirection: 'column',
    gap: 4,
  },
  actionButtonWrapper: {
    marginHorizontal: -16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActivityActionFilterBottomSheet;
