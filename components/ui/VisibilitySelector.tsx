import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { Globe, UserCheck, Lock } from 'lucide-react-native';
import { VisibilityLevel } from '@/types/user';

// Only 3 visibility levels: public, friends, private
// "followers" is treated the same as "public"
type DisplayVisibilityLevel = 'public' | 'friends' | 'private';

interface VisibilitySelectorProps {
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface OptionProps {
  level: DisplayVisibilityLevel;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function VisibilityOption({ level, isSelected, onPress, disabled }: OptionProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.95, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withTiming(1, { duration: 100 });
    }
  };

  const getIcon = () => {
    const iconColor = isSelected ? colors.buttonText : colors.secondaryText;
    const iconSize = 18;

    switch (level) {
      case 'public':
        return <Globe size={iconSize} color={iconColor} />;
      case 'friends':
        return <UserCheck size={iconSize} color={iconColor} />;
      case 'private':
        return <Lock size={iconSize} color={iconColor} />;
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'public':
        return t('privacy.public');
      case 'friends':
        return t('privacy.friends');
      case 'private':
        return t('privacy.private');
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.option,
        animatedStyle,
        {
          backgroundColor: isSelected ? colors.accent : colors.secondaryButton,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {getIcon()}
      <Text
        style={[
          typography.caption,
          styles.optionLabel,
          { color: isSelected ? colors.buttonText : colors.secondaryText },
        ]}
        numberOfLines={1}
      >
        {getLabel()}
      </Text>
    </AnimatedPressable>
  );
}

export default function VisibilitySelector({
  value,
  onChange,
  label,
  description,
  disabled = false,
}: VisibilitySelectorProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  // Only 3 display levels - "followers" is mapped to "public"
  const levels: DisplayVisibilityLevel[] = ['public', 'friends', 'private'];

  // Map "followers" to "public" for display purposes
  const displayValue: DisplayVisibilityLevel = value === 'followers' ? 'public' : value;

  return (
    <View style={styles.container}>
      {label && <Text style={[typography.body, { color: colors.text }]}>{label}</Text>}
      {description && (
        <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
          {description}
        </Text>
      )}
      <View style={styles.optionsRow}>
        {levels.map((level) => (
          <VisibilityOption
            key={level}
            level={level}
            isSelected={displayValue === level}
            onPress={() => onChange(level)}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
  },
  optionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 4,
  },
  optionLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
});
