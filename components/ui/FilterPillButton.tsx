import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';

interface FilterPillButtonProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function FilterPillButton({
  label,
  isActive = false,
  onPress,
  disabled = false,
}: FilterPillButtonProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const scaleAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.shadowContainer]}>
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: isActive ? `${colors.accent}15` : colors.card,
            borderColor: isActive ? colors.accent : colors.border,
          },
          disabled && { opacity: 0.5 },
        ]}
        onPress={onPress}
        onPressIn={() => {
          scaleAnim.value = withTiming(0.98, { duration: 220 });
        }}
        onPressOut={() => {
          scaleAnim.value = withTiming(1, { duration: 220 });
        }}
        disabled={disabled}
      >
        <Text
          style={[
            typography.caption,
            {
              color: isActive ? colors.accent : colors.secondaryText,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <ChevronDown
          size={14}
          strokeWidth={2}
          color={isActive ? colors.accent : colors.secondaryText}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
});
