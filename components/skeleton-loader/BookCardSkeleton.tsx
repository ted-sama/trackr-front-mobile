import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.33;
const IMAGE_HEIGHT = CARD_WIDTH * 1.5;

const BookCardSkeleton = () => {
  return (
    <View style={styles.container}>
      <SkeletonLoader width={CARD_WIDTH} height={IMAGE_HEIGHT} style={styles.image} />
      <View style={styles.textContainer}>
        <SkeletonLoader width={CARD_WIDTH * 0.9} height={16} style={styles.textLine} />
        <SkeletonLoader width={CARD_WIDTH * 0.6} height={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignItems: 'center',
    margin: 8,
  },
  image: {
    borderRadius: 8,
    marginBottom: 10,
  },
  textContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  textLine: {
    marginBottom: 6,
    borderRadius: 4,
  },
});

export default BookCardSkeleton; 