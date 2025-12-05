import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface BookListElementSkeletonProps {
  compact?: boolean;
}

const BookListElementSkeleton = ({ compact = false }: BookListElementSkeletonProps) => {
  const imageWidth = compact ? 40 : 60;
  const imageHeight = compact ? 60 : 90;

  return (
    <View style={styles.container}>
      <View style={styles.detailsGroup}>
        <SkeletonLoader width={imageWidth} height={imageHeight} style={styles.image} />
        <View style={styles.infoContainer}>
          <SkeletonLoader width={120} height={16} style={styles.title} />
          <SkeletonLoader width={80} height={12} style={styles.author} />
          {!compact && (
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              <SkeletonLoader width={60} height={20} style={{ borderRadius: 10 }} />
            </View>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {compact && (
          <SkeletonLoader width={40} height={20} style={{ borderRadius: 10 }} />
        )}
        <SkeletonLoader width={22} height={22} style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 11,
  },
});

export default BookListElementSkeleton; 