import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Search, Sparkles } from 'lucide-react-native';

interface ImportLoadingStateProps {
  title: string;
  tips: string[];
  /** Interval in ms between tip rotations */
  tipInterval?: number;
}

export function ImportLoadingState({
  title,
  tips,
  tipInterval = 4000,
}: ImportLoadingStateProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // Tip fade animation
  const tipOpacity = useSharedValue(1);

  // Progress bar animation (indeterminate)
  const progressX = useSharedValue(0);

  const barWidth = 120;

  useEffect(() => {
    if (trackWidth === 0) return;

    // Full sweep: start off-screen left, end off-screen right
    const totalTravel = trackWidth + barWidth;

    progressX.value = -barWidth;
    progressX.value = withRepeat(
      withSequence(
        withTiming(trackWidth, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-barWidth, { duration: 0 })
      ),
      -1,
      false
    );
  }, [trackWidth]);

  // Rotate tips
  useEffect(() => {
    if (tips.length <= 1) return;

    const interval = setInterval(() => {
      tipOpacity.value = withTiming(0, { duration: 300 }, () => {
        tipOpacity.value = withTiming(1, { duration: 300 });
      });

      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 300);
    }, tipInterval);

    return () => clearInterval(interval);
  }, [tips, tipInterval]);

  const tipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tipOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressX.value }],
  }));

  const handleTrackLayout = useCallback((e: any) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.container}>
      {/* Static icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.accent + '15' },
        ]}
      >
        <Search size={32} color={colors.accent} />
      </View>

      {/* Title */}
      <Text style={[typography.h3, { color: colors.text, marginBottom: 20 }]}>
        {title}
      </Text>

      {/* Indeterminate progress bar */}
      <View
        style={[styles.progressTrack, { backgroundColor: colors.border }]}
        onLayout={handleTrackLayout}
      >
        <Animated.View
          style={[
            styles.progressBar,
            { width: barWidth, backgroundColor: colors.accent },
            progressAnimatedStyle,
          ]}
        />
      </View>

      {/* Rotating tips */}
      <Animated.View style={[styles.tipContainer, tipAnimatedStyle]}>
        <Sparkles size={14} color={colors.secondaryText} style={{ marginRight: 6 }} />
        <Text style={[typography.caption, { color: colors.secondaryText, flex: 1 }]}>
          {tips[currentTipIndex]}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 20,
  },
});
