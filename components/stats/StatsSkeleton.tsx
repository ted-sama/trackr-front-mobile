import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";

export function StatsSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <SkeletonLoader width={200} height={32} style={{ borderRadius: 8 }} />
      </View>

      {/* Overview Cards - 6 cards in 3x2 grid */}
      <View style={styles.overviewGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.overviewCard}>
            <View style={[styles.cardInner, { backgroundColor: colors.card }]}>
              <SkeletonLoader width={20} height={20} style={{ borderRadius: 4, marginBottom: 8 }} />
              <SkeletonLoader width={60} height={24} style={{ borderRadius: 6, marginBottom: 4 }} />
              <SkeletonLoader width={80} height={12} style={{ borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </View>

      {/* Genre Chart Skeleton */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <SkeletonLoader width={120} height={14} style={{ borderRadius: 4, marginBottom: 16 }} />
        <View style={styles.pieChartContainer}>
          <SkeletonLoader width={200} height={200} style={{ borderRadius: 100 }} />
        </View>
        <View style={styles.legendContainer}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLoader key={index} width={80} height={24} style={{ borderRadius: 8 }} />
          ))}
        </View>
      </View>

      {/* Activity Chart Skeleton */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <SkeletonLoader width={160} height={14} style={{ borderRadius: 4, marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={200} style={{ borderRadius: 8 }} />
        <View style={styles.badgeContainer}>
          <SkeletonLoader width={100} height={28} style={{ borderRadius: 14 }} />
        </View>
      </View>

      {/* Heatmap Skeleton */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <SkeletonLoader width={180} height={14} style={{ borderRadius: 4, marginBottom: 16 }} />
        <View style={styles.heatmapGrid}>
          {Array.from({ length: 7 }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.heatmapRow}>
              <SkeletonLoader width={18} height={12} style={{ borderRadius: 2 }} />
              <View style={styles.heatmapCells}>
                {Array.from({ length: 24 }).map((_, cellIndex) => (
                  <SkeletonLoader
                    key={cellIndex}
                    width={10}
                    height={10}
                    style={{ borderRadius: 2 }}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  titleContainer: {
    marginBottom: 8,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  overviewCard: {
    flexBasis: "31%",
    flexGrow: 1,
  },
  cardInner: {
    padding: 12,
    borderRadius: 16,
  },
  chartCard: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
  },
  pieChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  badgeContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  heatmapGrid: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heatmapCells: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
});
