import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonLoaderProps {
  width: number | string;
  height: number | string;
  style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ width, height, style }) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1, // Infinite repeat
      true // Reverse animation
    );
    // Add cleanup function for component unmount
    return () => {
        // Optional: Cancel animation if needed, though reanimated handles this generally well
        // cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    // Animate opacity for the pulsing effect
    return {
      opacity: opacity.value,
    };
  });

  // Combine all static styles first, casting dimensions to ViewStyle
  const staticStyle = StyleSheet.flatten([
    styles.skeleton,
    { width, height } as ViewStyle, // Cast dimensions object
    { backgroundColor: colors.border }, // Base color from theme
    style, // Apply user-provided styles last to allow overrides
  ]);

  return (
    <Animated.View
      style={[
        staticStyle, // Apply all static styles
        animatedStyle, // Apply animated styles
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 4, // Default border radius, can be overridden by style prop
    overflow: 'hidden', // Ensure content (like gradient if added later) respects border radius
  },
});

export default SkeletonLoader; 