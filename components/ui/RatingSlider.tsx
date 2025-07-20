import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';

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
  const typography = useTypography();
  const [currentRating, setCurrentRating] = useState<number>(0);
  const scaleValue = useSharedValue(1);
  const startValue = useSharedValue(0);
  const isActive = useSharedValue(false);
  const { getTrackedBookStatus } = useTrackedBooksStore();
  
  useEffect(() => {
    const book = getTrackedBookStatus(bookId);
    // Get raw rating (could be number or string) and default to 0
    const rawRating = book?.rating ?? 0;
    // Convert to number if it's a string
    const numericRating = typeof rawRating === 'string' ? parseFloat(rawRating) : rawRating;
    setCurrentRating(numericRating);
  }, [bookId]);

  const updateRating = (newRating: number) => {
    const clampedRating = Math.max(0, Math.min(5, newRating));
    setCurrentRating(clampedRating);
    onValueChange(clampedRating);
    Haptics.selectionAsync();
  };

  const calculateRatingFromPosition = (x: number, containerWidth: number) => {
    'worklet';
    const starsWidth = containerWidth;
    const starWidth = starsWidth / 5;
    const position = Math.max(0, Math.min(x, starsWidth));
    const rating = (position / starWidth);
    
    // Snap to increments of 0.5
    return Math.round(rating * 2) / 2;
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true;
      startValue.value = currentRating;
      scaleValue.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      const containerWidth = 5 * (size + 8); // 5 stars with 8px margin each
      const rating = calculateRatingFromPosition(event.x, containerWidth);
      runOnJS(updateRating)(rating);
    })
    .onEnd(() => {
      isActive.value = false;
      scaleValue.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap()
    .onStart((event) => {
      const containerWidth = 5 * (size + 8);
      const rating = calculateRatingFromPosition(event.x, containerWidth);
      runOnJS(updateRating)(rating);
      
      scaleValue.value = withSpring(1.1, { duration: 100 }, () => {
        scaleValue.value = withSpring(1);
      });
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const rating = currentRating || 0;

    // Determine star fill based on current rating
    const getStarFill = () => {
      if (rating >= starValue) return colors.primary;
      if (rating >= starValue - 0.5) return colors.primary;
      return 'transparent';
    };

    const getStarOpacity = () => {
      if (rating >= starValue) return 1;
      if (rating >= starValue - 0.5) return 0.6;
      return 0.3;
    };

    const shouldShowHalf = rating >= starValue - 0.5 && rating < starValue;

    return (
      <View
        key={index}
        style={{ marginHorizontal: 4 }}
      >
        <View style={{ position: 'relative' }}>
          <Star
            size={size}
            color={colors.primary}
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
            >
              <Star
                size={size}
                color={colors.primary}
                fill={colors.primary}
                strokeWidth={1.5}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {showValue && (
        <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginBottom: 24 }]}>
          {currentRating === 0 ? 'Pas encore noté' : `${(currentRating || 0).toFixed(1)}/5.0`}
        </Text>
      )}
      
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.starsContainer, animatedStyle]}>
          {[0, 1, 2, 3, 4].map(renderStar)}
        </Animated.View>
      </GestureDetector>

      <Text style={[typography.caption, { color: colors.secondaryText, textAlign: 'center', marginTop: 16 }]}>
        Glissez ou touchez pour noter
      </Text>

        <View style={styles.resetContainer}>
          <Text
            style={[
              typography.caption,
              { 
                color: currentRating === 0 ? colors.secondaryText : colors.primary,
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
            Supprimer la note
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