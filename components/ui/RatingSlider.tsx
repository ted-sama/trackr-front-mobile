import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface RatingSliderProps {
  initialValue?: number;
  onValueChange: (value: number) => void;
  size?: number;
  showValue?: boolean;
  style?: any;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  initialValue = 0,
  onValueChange,
  size = 52,
  showValue = true,
  style,
}) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const [currentRating, setCurrentRating] = useState<number>(0);
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    const validRating = typeof initialValue === 'number' && !isNaN(initialValue) ? initialValue : 0;
    setCurrentRating(validRating);
  }, [initialValue]);

  const updateRating = (newRating: number) => {
    const clampedRating = Math.max(0.5, Math.min(5, newRating));
    setCurrentRating(clampedRating);
    onValueChange(clampedRating);
    Haptics.selectionAsync();
    
    // Animation feedback
    scaleValue.value = withSpring(1.1, { duration: 100 }, () => {
      scaleValue.value = withSpring(1);
    });
  };

  const handleStarPress = (starIndex: number) => {
    const starValue = starIndex + 1;
    
    // If clicking on the same star that's currently selected, toggle half star
    const rating = currentRating || 0;
    if (rating === starValue) {
      updateRating(starValue - 0.5);
    } else if (rating === starValue - 0.5) {
      updateRating(starValue);
    } else {
      updateRating(starValue);
    }
  };

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
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(index)}
        activeOpacity={0.7}
        style={{ marginHorizontal: 4 }}
      >
        <Animated.View style={animatedStyle}>
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
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Quick rating buttons for common ratings
  const quickRatings = [0.5, 1, 2, 3, 4, 5];

  return (
    <View style={[styles.container, style]}>
      {showValue && (
        <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginBottom: 24 }]}>
          {(currentRating || 0).toFixed(1)}/5.0
        </Text>
      )}
      
      <View style={styles.starsContainer}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>

      <Text style={[typography.caption, { color: colors.secondaryText, textAlign: 'center', marginTop: 16 }]}>
        Touchez une étoile pour noter
      </Text>

      {/* Quick rating buttons */}
      <View style={styles.quickRatingContainer}>
        {quickRatings.map((rating) => (
          <TouchableOpacity
            key={rating}
            onPress={() => updateRating(rating)}
            style={[
              styles.quickRatingButton,
              { 
                backgroundColor: (currentRating || 0) === rating ? colors.primary : colors.actionButton,
              }
            ]}
          >
            <Text style={[
              typography.caption,
              { 
                color: (currentRating || 0) === rating ? colors.background : colors.text,
                fontWeight: (currentRating || 0) === rating ? 'bold' : 'normal'
              }
            ]}>
              {rating.toFixed(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
  },
  quickRatingContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  quickRatingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
});

export default RatingSlider; 