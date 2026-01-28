import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface CategorySliderSkeletonProps {
  itemCount?: number;
}

const CategorySliderSkeleton = ({ itemCount = 3 }: CategorySliderSkeletonProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonLoader width={180} height={20} />
      </View>
      <View style={styles.sliderContent}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <View key={index} style={styles.item}>
            <SkeletonLoader width={110} height={165} style={styles.cover} />
            <SkeletonLoader width={100} height={14} style={styles.title} />
            <SkeletonLoader width={80} height={12} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sliderContent: {
    flexDirection: 'row',
    paddingLeft: 16,
  },
  item: {
    marginRight: 12,
  },
  cover: {
    borderRadius: 6,
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
  },
});

export default CategorySliderSkeleton;
