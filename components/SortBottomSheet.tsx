/* eslint-disable react/display-name */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import {
  StarIcon,
  TypeIcon,
  UserIcon,
  CalendarIcon,
  Check,
} from 'lucide-react-native';

export type SortType = 'rating' | 'title' | 'author' | 'date';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  type: SortType;
  order: SortOrder;
}

export interface SortBottomSheetProps {
  onSortChange: (sortOption: SortOption) => void;
  currentSort?: SortOption;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SortButtonProps {
  option: SortOption & { label: string; icon: React.ReactNode };
  isSelected: boolean;
  onPress: () => void;
  typography: ReturnType<typeof useTypography>;
  colors: ReturnType<typeof useTheme>['colors'];
}

const SortButton = ({ option, isSelected, onPress, typography, colors }: SortButtonProps) => {
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
        {option.icon}
        <Text
          style={[
            typography.h3,
            { color: colors.text, flex: 1 },
          ]}
        >
          {option.label}
        </Text>
      </View>
      {isSelected && (
        <Check size={20} strokeWidth={2.75} color={colors.accent} />
      )}
    </AnimatedPressable>
  );
};

const SortBottomSheet = forwardRef<TrueSheet, SortBottomSheetProps>(
  ({ onSortChange, currentSort }, ref) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const typography = useTypography();

    const sortOptions: (SortOption & { label: string; icon: React.ReactNode })[] = [
      {
        type: 'rating',
        order: 'desc',
        label: t('collection.myLibrary.sort.rating_desc'),
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'rating',
        order: 'asc',
        label: t('collection.myLibrary.sort.rating_asc'),
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'title',
        order: 'asc',
        label: t('collection.myLibrary.sort.title_asc'),
        icon: <TypeIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'title',
        order: 'desc',
        label: t('collection.myLibrary.sort.title_desc'),
        icon: <TypeIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'author',
        order: 'asc',
        label: t('collection.myLibrary.sort.author_asc'),
        icon: <UserIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'author',
        order: 'desc',
        label: t('collection.myLibrary.sort.author_desc'),
        icon: <UserIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'date',
        order: 'desc',
        label: t('collection.myLibrary.sort.date_desc'),
        icon: <CalendarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
      {
        type: 'date',
        order: 'asc',
        label: t('collection.myLibrary.sort.date_asc'),
        icon: <CalendarIcon size={16} strokeWidth={2.75} color={colors.text} />,
      },
    ];

    const handleSortPress = (sortOption: SortOption) => {
      onSortChange(sortOption);
      const sheetRef = typeof ref === 'object' ? ref?.current : null;
      if (sheetRef) {
        sheetRef.dismiss();
      }
    };

    const checkIsSelected = (option: SortOption) => {
      return (
        currentSort?.type === option.type && currentSort?.order === option.order
      );
    };

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        cornerRadius={30}
        backgroundColor={colors.background}
        grabber={false}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.header}>
            <Text style={[typography.categoryTitle, { color: colors.text }]}>
              {t('collection.myLibrary.sort.title')}
            </Text>
          </View>
          <View style={styles.sortOptions}>
            {sortOptions.map((option, idx) => (
              <SortButton
                key={`${option.type}-${option.order}-${idx}`}
                option={option}
                isSelected={checkIsSelected(option)}
                onPress={() => handleSortPress(option)}
                typography={typography}
                colors={colors}
              />
            ))}
          </View>
        </View>
      </TrueSheet>
    );
  }
);

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

export default SortBottomSheet;
