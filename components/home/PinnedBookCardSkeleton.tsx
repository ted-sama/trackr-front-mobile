import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";

export default function PinnedBookCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.content}>
        {/* Cover skeleton */}
        <SkeletonLoader width={70} height={105} style={{ borderRadius: 8 }} />

        {/* Info skeleton */}
        <View style={styles.infoContainer}>
          <SkeletonLoader width="80%" height={18} style={{ borderRadius: 4 }} />
          <View style={{ height: 6 }} />
          <SkeletonLoader width="50%" height={14} style={{ borderRadius: 4 }} />
          <View style={{ height: 12 }} />
          <SkeletonLoader width="100%" height={4} style={{ borderRadius: 2 }} />
          <View style={{ height: 12 }} />
          <SkeletonLoader width="100%" height={40} style={{ borderRadius: 8 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    gap: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
});
