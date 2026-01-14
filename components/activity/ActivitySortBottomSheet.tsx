import React, { forwardRef } from 'react';
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
import { ArrowDownIcon, ArrowUpIcon, Check } from 'lucide-react-native';

export type ActivitySort = 'recent' | 'oldest';

export interface ActivitySortBottomSheetProps {
  onSortChange: (sort: ActivitySort) => void;
  currentSort: ActivitySort;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SortOptionProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTypography>;
}

const SortOption = ({
  label,
  icon,
  isSelected,
  onPress,
  colors,
  typography,
}: SortOptionProps) => {
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
      style={[styles.sortButton, animatedStyle]}
    >
      <View style={styles.sortButtonContent}>
        {icon}
        <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>
          {label}
        </Text>
      </View>
      {isSelected && (
        <Check size={20} strokeWidth={2.75} color={colors.accent} />
      )}
    </AnimatedPressable>
  );
};

const ActivitySortBottomSheet = forwardRef<
  TrueSheet,
  ActivitySortBottomSheetProps
>(({ onSortChange, currentSort }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();

  const sortOptions: { value: ActivitySort; label: string; icon: React.ReactNode }[] = [
    {
      value: 'recent',
      label: t('activity.filters.sort.recent'),
      icon: <ArrowDownIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'oldest',
      label: t('activity.filters.sort.oldest'),
      icon: <ArrowUpIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
  ];

  const handleSortPress = (sort: ActivitySort) => {
    Haptics.selectionAsync();
    onSortChange(sort);
    const sheetRef = typeof ref === 'object' ? ref?.current : null;
    if (sheetRef) {
      sheetRef.dismiss();
    }
  };

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
            {t('activity.filters.sort.title')}
          </Text>
        </View>
        <View style={styles.sortOptions}>
          {sortOptions.map((option) => (
            <SortOption
              key={option.value}
              label={option.label}
              icon={option.icon}
              isSelected={currentSort === option.value}
              onPress={() => handleSortPress(option.value)}
              colors={colors}
              typography={typography}
            />
          ))}
        </View>
      </View>
    </TrueSheet>
  );
});

ActivitySortBottomSheet.displayName = 'ActivitySortBottomSheet';

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sortOptions: {
    flexDirection: 'column',
    gap: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
});

export default ActivitySortBottomSheet;
