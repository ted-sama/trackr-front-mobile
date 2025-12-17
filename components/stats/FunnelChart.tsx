import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "@/utils/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, CheckCircle2, PauseCircle, XCircle } from "lucide-react-native";

interface FunnelCounts {
  reading: number;
  completed: number;
  on_hold: number;
  dropped: number;
}

interface FunnelChartProps {
  counts: FunnelCounts;
}

const STATUS_ICONS = {
  reading: BookOpen,
  completed: CheckCircle2,
  on_hold: PauseCircle,
  dropped: XCircle,
};

interface AnimatedBarProps {
  item: { key: string; label: string; value: number; color: string };
  ratio: number;
  index: number;
  colors: any;
  typography: any;
}

function AnimatedBar({ item, ratio, index, colors, typography }: AnimatedBarProps) {
  const progress = useSharedValue(0);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 100, withSpring(1, { damping: 15, stiffness: 100 }));
    barProgress.value = withDelay(index * 100 + 200, withTiming(ratio, { duration: 800 }));
  }, [ratio]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-20, 0], Extrapolation.CLAMP) }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value}%`,
  }));

  const Icon = STATUS_ICONS[item.key as keyof typeof STATUS_ICONS] || BookOpen;

  return (
    <Animated.View style={[styles.funnelRow, containerStyle]}>
      <View style={[styles.iconContainer, { backgroundColor: hexToRgba(item.color, 0.15) }]}>
        <Icon size={16} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.labelRow}>
          <Text style={[typography.body, { color: colors.text, fontWeight: "500" }]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[typography.caption, { color: item.color, fontWeight: "600" }]}>
            {item.value}
          </Text>
        </View>
        <View style={[styles.funnelBarBackground, { backgroundColor: hexToRgba(item.color, 0.1) }]}>
          <Animated.View style={[styles.funnelBarFill, barStyle]}>
            <LinearGradient
              colors={[item.color, hexToRgba(item.color, 0.7)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>
      </View>
      <View style={[styles.percentBadge, { backgroundColor: hexToRgba(item.color, 0.1) }]}>
        <Text style={[typography.caption, { color: item.color, fontWeight: "600", fontSize: 11 }]}>
          {ratio.toFixed(0)}%
        </Text>
      </View>
    </Animated.View>
  );
}

export function FunnelChart({ counts }: FunnelChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const total = useMemo(
    () => counts.reading + counts.completed + counts.on_hold + counts.dropped,
    [counts]
  );

  const funnelData = useMemo(
    () => [
      { key: "reading", label: t("status.reading"), value: counts.reading, color: colors.reading },
      { key: "completed", label: t("status.completed"), value: counts.completed, color: colors.completed },
      { key: "on_hold", label: t("status.onHold"), value: counts.on_hold, color: colors.onHold },
      { key: "dropped", label: t("status.dropped"), value: counts.dropped, color: colors.dropped },
    ],
    [counts, colors, t]
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
      <View style={styles.funnelContainer}>
        {funnelData.map((item, index) => {
          const ratio = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <AnimatedBar key={item.key} item={item} ratio={ratio} index={index} colors={colors} typography={typography} />
          );
        })}
      </View>

      <View style={styles.totalContainer}>
        <View style={[styles.totalBadge, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
          <Text style={[typography.caption, { color: colors.accent, fontWeight: "600" }]}>
            {t("stats.funnel.total", { count: total })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  funnelContainer: {
    gap: 14,
  },
  funnelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  funnelBarBackground: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  funnelBarFill: {
    height: "100%",
    borderRadius: 5,
    overflow: "hidden",
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 45,
    alignItems: "center",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  totalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
