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
import {
  CalendarIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  Check,
} from 'lucide-react-native';

export type ActivityPeriod = 'all' | 'today' | 'week' | 'month' | 'year';

export interface ActivityPeriodBottomSheetProps {
  onPeriodChange: (period: ActivityPeriod) => void;
  currentPeriod: ActivityPeriod;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PeriodOptionProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTypography>;
}

const PeriodOption = ({
  label,
  icon,
  isSelected,
  onPress,
  colors,
  typography,
}: PeriodOptionProps) => {
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
      style={[styles.periodButton, animatedStyle]}
    >
      <View style={styles.periodButtonContent}>
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

const ActivityPeriodBottomSheet = forwardRef<
  TrueSheet,
  ActivityPeriodBottomSheetProps
>(({ onPeriodChange, currentPeriod }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();

  const periodOptions: {
    value: ActivityPeriod;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'all',
      label: t('activity.filters.period.all'),
      icon: <CalendarRangeIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'today',
      label: t('activity.filters.period.today'),
      icon: <CalendarIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'week',
      label: t('activity.filters.period.week'),
      icon: <CalendarDaysIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'month',
      label: t('activity.filters.period.month'),
      icon: <CalendarDaysIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      value: 'year',
      label: t('activity.filters.period.year'),
      icon: <CalendarRangeIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
  ];

  const handlePeriodPress = (period: ActivityPeriod) => {
    Haptics.selectionAsync();
    onPeriodChange(period);
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
            {t('activity.filters.period.title')}
          </Text>
        </View>
        <View style={styles.periodOptions}>
          {periodOptions.map((option) => (
            <PeriodOption
              key={option.value}
              label={option.label}
              icon={option.icon}
              isSelected={currentPeriod === option.value}
              onPress={() => handlePeriodPress(option.value)}
              colors={colors}
              typography={typography}
            />
          ))}
        </View>
      </View>
    </TrueSheet>
  );
});

ActivityPeriodBottomSheet.displayName = 'ActivityPeriodBottomSheet';

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  periodOptions: {
    flexDirection: 'column',
    gap: 4,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  periodButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
});

export default ActivityPeriodBottomSheet;
