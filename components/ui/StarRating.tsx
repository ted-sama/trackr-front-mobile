import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    let starName: 'star' | 'star-half' | 'star-outline' = 'star-outline';

    if (diff >= 1) {
      starName = 'star';
    } else if (diff >= 0.5) {
      starName = 'star-half';
    }

    stars.push(
      <Ionicons
        key={i}
        name={starName}
        size={size}
        color={color}
        style={styles.star}
      />
    );
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
