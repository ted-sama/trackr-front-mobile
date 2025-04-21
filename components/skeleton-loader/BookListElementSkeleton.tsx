import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

const BookListElementSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.detailsGroup}>
        <SkeletonLoader width={45} height={68} style={styles.image} />
        <View style={styles.infoContainer}>
          <SkeletonLoader width={120} height={16} style={styles.title} />
          <SkeletonLoader width={80} height={12} style={styles.author} />
        </View>
      </View>
      <SkeletonLoader width={28} height={28} style={styles.icon} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  detailsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  image: {
    borderRadius: 4,
  },
  infoContainer: {
    marginHorizontal: 16,
    flexShrink: 1,
  },
  title: {
    marginBottom: 4,
    borderRadius: 4,
  },
  author: {
    marginBottom: 2,
    borderRadius: 4,
  },
  icon: {
    borderRadius: 14,
  },
});

export default BookListElementSkeleton; 