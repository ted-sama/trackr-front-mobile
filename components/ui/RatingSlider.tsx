import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { useTranslation } from 'react-i18next';

interface RatingSliderProps {
  bookId: string;
  onValueChange: (value: number) => void;
  size?: number;
  showValue?: boolean;
  style?: any;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  bookId,
  onValueChange,
  size = 52,
  showValue = true,
  style,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const typography = useTypography();
  const [currentRating, setCurrentRating] = useState<number>(0);
  const scaleValue = useSharedValue(1);
  const { getTrackedBookStatus } = useTrackedBooksStore();

  const starWidth = size + 8; // size + margins
  const containerWidth = 5 * starWidth;

  useEffect(() => {
    const book = getTrackedBookStatus(bookId);
    const rawRating = book?.rating ?? 0;
    const numericRating = typeof rawRating === 'string' ? parseFloat(rawRating) : rawRating;
    setCurrentRating(numericRating);
  }, [bookId]);

  const updateRating = (newRating: number) => {
    const clampedRating = Math.max(0, Math.min(5, newRating));
    if (clampedRating !== currentRating) {
      setCurrentRating(clampedRating);
      onValueChange(clampedRating);
      Haptics.selectionAsync();
    }
  };

  const calculateRatingFromX = (x: number) => {
    'worklet';
    const position = Math.max(0, Math.min(x, containerWidth));
    const rating = position / starWidth;
    return Math.round(rating * 2) / 2; // Snap to 0.5 increments
  };

  const handleStarPress = (index: number, isLeftHalf: boolean) => {
    const starValue = index + 1;
    const rating = isLeftHalf ? starValue - 0.5 : starValue;
    scaleValue.value = withSpring(1.05, { duration: 150 }, () => {
      scaleValue.value = withSpring(1);
    });
    updateRating(rating);
  };

  // Pan gesture for dragging - only horizontal, fails on vertical movement
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      scaleValue.value = withSpring(1.03);
    })
    .onUpdate((event) => {
      const rating = calculateRatingFromX(event.x);
      runOnJS(updateRating)(rating);
    })
    .onEnd(() => {
      scaleValue.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const rating = currentRating || 0;

    const getStarFill = () => {
      if (rating >= starValue) return colors.accent;
      if (rating >= starValue - 0.5) return colors.accent;
      return 'transparent';
    };

    const getStarOpacity = () => {
      if (rating >= starValue) return 1;
      if (rating >= starValue - 0.5) return 0.6;
      return 0.3;
    };

    const shouldShowHalf = rating >= starValue - 0.5 && rating < starValue;

    return (
      <View key={index} style={{ marginHorizontal: 4, position: 'relative' }}>
        <Star
          size={size}
          color={colors.accent}
          fill={getStarFill()}
          strokeWidth={1.5}
          opacity={getStarOpacity()}
        />
        {shouldShowHalf && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size / 2,
              overflow: 'hidden',
            }}
            pointerEvents="none"
          >
            <Star
              size={size}
              color={colors.accent}
              fill={colors.accent}
              strokeWidth={1.5}
            />
          </View>
        )}
        {/* Touch zones for tap */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => handleStarPress(index, true)}
            style={{ flex: 1 }}
            activeOpacity={0.7}
          />
          <TouchableOpacity
            onPress={() => handleStarPress(index, false)}
            style={{ flex: 1 }}
            activeOpacity={0.7}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {showValue && (
        <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginBottom: 24 }]}>
          {currentRating === 0 ? t("ratingSlider.notRated") : `${(currentRating || 0).toFixed(1)}/5.0`}
        </Text>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.starsContainer, animatedStyle]}>
          {[0, 1, 2, 3, 4].map(renderStar)}
        </Animated.View>
      </GestureDetector>

      <Text style={[typography.caption, { color: colors.secondaryText, textAlign: 'center', marginTop: 16 }]}>
        {t("ratingSlider.dragOrTapToRate")}
      </Text>

      <View style={styles.resetContainer}>
        <Text
          style={[
            typography.caption,
            {
              color: currentRating === 0 ? colors.secondaryText : colors.accent,
              textAlign: 'center',
              marginTop: 12,
              textDecorationLine: currentRating === 0 ? 'none' : 'underline',
              opacity: currentRating === 0 ? 0.5 : 1,
            }
          ]}
          onPress={currentRating === 0 ? undefined : () => updateRating(0)}
          accessibilityState={{ disabled: currentRating === 0 }}
          disabled={currentRating === 0}
        >
          {t("ratingSlider.deleteRating")}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resetContainer: {
    marginTop: 8,
  },
});

export default RatingSlider;
