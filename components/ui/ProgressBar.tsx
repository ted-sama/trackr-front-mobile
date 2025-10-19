import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface ProgressBarProps {
  /**
   * Current progress value (e.g., current chapter)
   */
  current: number;
  /**
   * Maximum progress value (e.g., total chapters)
   */
  max: number;
  /**
   * Height of the progress bar in pixels
   * @default 6
   */
  height?: number;
  /**
   * Border radius of the progress bar
   * @default 999
   */
  borderRadius?: number;
  /**
   * Custom background color for the unfilled portion
   */
  backgroundColor?: string;
  /**
   * Custom color for the filled portion
   */
  progressColor?: string;
  /**
   * Animation type
   * @default 'spring'
   */
  animationType?: 'spring' | 'timing';
  /**
   * Additional styles for the container
   */
  style?: ViewStyle;
  /**
   * Show a subtle glow effect
   * @default false
   */
  showGlow?: boolean;
}

export default function ProgressBar({
  current,
  max,
  height = 6,
  borderRadius = 999,
  backgroundColor,
  progressColor,
  animationType = 'spring',
  style,
  showGlow = false,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  // Calculate progress percentage
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  useEffect(() => {
    if (animationType === 'spring') {
      progress.value = withSpring(percentage, {
        damping: 15,
        stiffness: 100,
        mass: 0.5,
      });
    } else {
      progress.value = withTiming(percentage, {
        duration: 500,
      });
    }
  }, [percentage, animationType]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  const bgColor = backgroundColor || colors.border;
  const fillColor = progressColor || colors.accent;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            height,
            borderRadius,
            backgroundColor: fillColor,
            ...(showGlow && {
              shadowColor: fillColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }),
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

