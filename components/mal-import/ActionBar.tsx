import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';

interface ActionBarProps {
  selectedCount: number;
  totalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionBar({
  selectedCount,
  totalCount,
  onCancel,
  onConfirm,
  confirmDisabled = false,
}: ActionBarProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const cancelScale = useSharedValue(1);
  const confirmScale = useSharedValue(1);

  const cancelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  const confirmAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  return (
    <View style={[styles.actionBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.actionBarLeft}>
        <AnimatedPressable
          onPressIn={() => {
            cancelScale.value = withTiming(0.98, { duration: 220 });
          }}
          onPressOut={() => {
            cancelScale.value = withTiming(1, { duration: 220 });
          }}
          style={[styles.actionButton, { backgroundColor: colors.actionButton }, cancelAnimatedStyle]}
          onPress={onCancel}
        >
          <X size={18} color={colors.text} />
          <Text style={[typography.bodyBold, { color: colors.text, marginLeft: 6 }]}>
            {t('malImport.cancel')}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.actionBarCenter}>
        <Text style={[typography.caption, { color: colors.secondaryText }]}>
          {selectedCount}/{totalCount}
        </Text>
      </View>

      <View style={styles.actionBarRight}>
        <AnimatedPressable
          onPressIn={() => {
            confirmScale.value = withTiming(0.98, { duration: 220 });
          }}
          onPressOut={() => {
            confirmScale.value = withTiming(1, { duration: 220 });
          }}
          style={[styles.actionButton, { backgroundColor: colors.accent, opacity: confirmDisabled ? 0.6 : 1 }, confirmAnimatedStyle]}
          onPress={onConfirm}
          disabled={confirmDisabled}
        >
          <Check size={18} color="#fff" />
          <Text style={[typography.bodyBold, { color: '#fff', marginLeft: 6 }]} numberOfLines={1}>
            {confirmDisabled ? t('malImport.importing') : t('malImport.confirm')}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  actionBarLeft: {
    flex: 1,
  },
  actionBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  actionBarRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
