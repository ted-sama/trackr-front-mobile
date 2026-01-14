import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 12,
  color = '#FFD700'
}) => {
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const diff = rating - (i - 1);

    if (diff >= 1) {
      // Full star
      stars.push(
        <Star
          key={i}
          size={size}
          color={color}
          fill={color}
          strokeWidth={2}
          style={styles.star}
        />
      );
    } else if (diff >= 0.5) {
      // Half star using clip technique
      stars.push(
        <View
          key={i}
          style={[styles.star, { width: size, height: size, position: 'relative' }]}
        >
          {/* Filled left half */}
          <View
            style={{
              position: 'absolute',
              width: size / 2,
              height: size,
              overflow: 'hidden',
              left: 0,
              top: 0,
            }}
          >
            <Star
              size={size}
              color={color}
              fill={color}
              strokeWidth={2}
            />
          </View>
          {/* Outline full star */}
          <Star
            size={size}
            color={color}
            fill="transparent"
            strokeWidth={2}
          />
        </View>
      );
    } else {
      // Empty star
      stars.push(
        <Star
          key={i}
          size={size}
          color={color}
          fill="transparent"
          strokeWidth={2}
          opacity={0.3}
          style={styles.star}
        />
      );
    }
  }

  return (
    <View style={styles.container}>
      {stars}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
});

export default StarRating;
