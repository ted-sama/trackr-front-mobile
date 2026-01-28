import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface LastReadSkeletonProps {
  itemCount?: number;
}

const LastReadSkeleton = ({ itemCount = 3 }: LastReadSkeletonProps) => {
  return (
    <View style={styles.container}>
      <SkeletonLoader width={120} height={20} style={styles.sectionTitle} />
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.row}>
            <SkeletonLoader width={40} height={60} style={styles.cover} />
            <View style={styles.info}>
              <View>
                <SkeletonLoader width="80%" height={16} style={styles.title} />
                <SkeletonLoader width="60%" height={12} style={styles.author} />
                <View style={styles.badgeRow}>
                  <SkeletonLoader width={60} height={20} style={styles.badge} />
                  <SkeletonLoader width={40} height={20} style={styles.badge} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
      <SkeletonLoader width={140} height={16} style={styles.link} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  item: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cover: {
    borderRadius: 4,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: 4,
  },
  author: {
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 10,
  },
  link: {
    marginTop: 22,
    alignSelf: 'center',
  },
});

export default LastReadSkeleton;
