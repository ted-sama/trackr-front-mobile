import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { useTheme } from '@/contexts/ThemeContext';

const ChapterListElementSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <SkeletonLoader width={60} height={16} style={styles.chapterNumber} />
      <SkeletonLoader width={180} height={14} style={styles.title} />
      <View style={styles.dateRow}>
        <SkeletonLoader width={16} height={16} style={styles.icon} />
        <SkeletonLoader width={120} height={12} style={styles.date} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 0,
  },
  chapterNumber: {
    marginBottom: 8,
    borderRadius: 4,
  },
  title: {
    marginBottom: 8,
    borderRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    borderRadius: 8,
    marginRight: 8,
  },
  date: {
    borderRadius: 4,
  },
});

export default ChapterListElementSkeleton; 