import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface ListSectionSkeletonProps {
  itemCount?: number;
  showSectionTitle?: boolean;
}

const COVER_WIDTH = 60;
const COVER_HEIGHT = 90;
const STACK_OFFSET = 20;
const CONTAINER_WIDTH = 100;

const ListItemSkeleton = () => {
  return (
    <View style={styles.listItem}>
      {/* Stacked covers */}
      <View style={styles.coverStack}>
        {[0, 1, 2].map((index) => {
          const coverStyle: ViewStyle = {
            ...styles.stackedCover,
            left: index * STACK_OFFSET,
            zIndex: 3 - index,
          };
          return (
            <SkeletonLoader
              key={index}
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              style={coverStyle}
            />
          );
        })}
      </View>
      {/* Text info */}
      <View style={styles.info}>
        <SkeletonLoader width={140} height={18} style={styles.title} />
        <SkeletonLoader width={80} height={14} style={styles.subtitle} />
        <SkeletonLoader width={120} height={12} />
      </View>
    </View>
  );
};

const ListSectionSkeleton = ({
  itemCount = 3,
  showSectionTitle = true
}: ListSectionSkeletonProps) => {
  return (
    <View style={styles.section}>
      {showSectionTitle && (
        <SkeletonLoader width={140} height={20} style={styles.sectionTitle} />
      )}
      <View style={styles.listContainer}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  listContainer: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverStack: {
    width: CONTAINER_WIDTH,
    height: COVER_HEIGHT,
    position: 'relative',
  },
  stackedCover: {
    position: 'absolute',
    borderRadius: 4,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    borderRadius: 4,
  },
  subtitle: {
    borderRadius: 4,
  },
});

export default ListSectionSkeleton;
