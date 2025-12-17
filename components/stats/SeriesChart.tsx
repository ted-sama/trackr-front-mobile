import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { CartesianChart, Bar, useChartPressState } from "victory-native";
import { hexToRgba } from "@/utils/colors";
import type { SkFont } from "@shopify/react-native-skia";
import { Circle } from "@shopify/react-native-skia";
import type { SeriesProgress } from "@/types/stats";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { BookOpen } from "lucide-react-native";

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface SeriesChartProps {
  distributionData: SimplePoint[];
  currentProgress: SeriesProgress[];
  font: SkFont | null;
}

interface BarHighlightProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  color: string;
}

function BarHighlight({ x, y, color }: BarHighlightProps) {
  return (
    <>
      <Circle cx={x} cy={y} r={6} color={color} opacity={0.4} />
      <Circle cx={x} cy={y} r={3} color={color} />
    </>
  );
}

export function SeriesChart({ distributionData, currentProgress, font }: SeriesChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const { state, isActive } = useChartPressState({
    x: "",
    y: { value: 0 }
  });

  const maxValue = useMemo(
    () => Math.max(...distributionData.map((p) => p.value || 0), 1),
    [distributionData]
  );

  const totalSeries = useMemo(
    () => distributionData.reduce((sum, p) => sum + (p.value || 0), 0),
    [distributionData]
  );

  const chartData = useMemo(() =>
    distributionData.map((point) => ({
      ...point,
      label:
        point.label === "oneshot" ? t("stats.series.oneshot") :
        point.label === "short" ? t("stats.series.short") :
        point.label === "medium" ? t("stats.series.medium") :
        point.label === "long" ? t("stats.series.long") : point.label,
    })),
    [distributionData, t]
  );

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) }),
    transform: [{ scale: withTiming(isActive ? 1 : 0.95, { duration: 200, easing: Easing.out(Easing.ease) }) }],
  }));

  if (!distributionData.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
      <Text style={[typography.bodyCaption, { color: colors.secondaryText, marginBottom: 12 }]}>
        {t("stats.series.chartTitle")}
      </Text>

      <Animated.View style={[styles.tooltipContainer, tooltipStyle]}>
        <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tooltipRow}>
            <BookOpen size={14} color={colors.accent} />
            <Text style={[typography.caption, { color: colors.accent, fontWeight: "600", marginLeft: 4 }]}>
              {state.x.value.value}
            </Text>
          </View>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
            {state.y.value.value.value.toFixed(0)} {t("stats.series.count")}
          </Text>
        </View>
      </Animated.View>

      <View style={{ height: 210 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={chartData}
          xKey="label"
          yKeys={["value"]}
          chartPressState={state}
          axisOptions={{
            tickCount: { x: distributionData.length, y: 5 },
            labelColor: colors.secondaryText,
            font,
          }}
          domain={{ y: [0, maxValue * 1.4] }}
          domainPadding={{ left: 30, right: 30 }}
        >
          {({ points, chartBounds }) => (
            <>
              <Bar
                chartBounds={chartBounds}
                points={points.value}
                barWidth={26}
                roundedCorners={{ topLeft: 6, topRight: 6 }}
                color={hexToRgba(colors.accent, 0.85)}
                animate={{ type: "spring", duration: 700 }}
                labels={{ position: "top", font, color: colors.text }}
              />
              {isActive && (
                <BarHighlight x={state.x.position} y={state.y.value.position} color={colors.accent} />
              )}
            </>
          )}
        </CartesianChart>
      </View>

      <View style={styles.totalContainer}>
        <View style={[styles.totalBadge, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
          <Text style={[typography.caption, { color: colors.accent, fontWeight: "600" }]}>
            {totalSeries} {t("stats.series.completed")}
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
  tooltipContainer: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 10,
  },
  tooltip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
