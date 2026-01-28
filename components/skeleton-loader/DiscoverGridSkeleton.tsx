import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GRID_PADDING = 16;
const GRID_GAP = 12;
const ITEM_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface DiscoverGridSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

const DiscoverGridSkeleton = ({ rows = 4, showHeader = true }: DiscoverGridSkeletonProps) => {
  const totalItems = rows * NUM_COLUMNS;

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <SkeletonLoader width={160} height={20} />
        </View>
      )}
      <View style={styles.grid}>
        {Array.from({ length: Math.ceil(totalItems / NUM_COLUMNS) }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: NUM_COLUMNS }).map((_, colIndex) => {
              const itemIndex = rowIndex * NUM_COLUMNS + colIndex;
              if (itemIndex >= totalItems) return null;
              return (
                <View key={colIndex} style={styles.item}>
                  <SkeletonLoader width={ITEM_WIDTH} height={ITEM_HEIGHT} style={styles.cover} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: GRID_PADDING,
    marginBottom: 16,
  },
  grid: {
    paddingHorizontal: GRID_PADDING,
  },
  row: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  item: {
    width: ITEM_WIDTH,
  },
  cover: {
    borderRadius: 6,
  },
});

export default DiscoverGridSkeleton;
