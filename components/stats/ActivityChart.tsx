import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { CartesianChart, Line, Scatter, useChartPressState } from "victory-native";
import { hexToRgba } from "@/utils/colors";
import type { SkFont } from "@shopify/react-native-skia";
import { Circle } from "@shopify/react-native-skia";
import { useTranslation } from "react-i18next";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface ActivityChartProps {
  data: SimplePoint[];
  font: SkFont | null;
}

interface TooltipProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  color: string;
}

function ChartTooltip({ x, y, color }: TooltipProps) {
  return (
    <>
      <Circle cx={x} cy={y} r={8} color={color} opacity={0.3} />
      <Circle cx={x} cy={y} r={5} color={color} />
    </>
  );
}

export function ActivityChart({ data, font }: ActivityChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const { state, isActive } = useChartPressState({
    x: "",
    y: { value: 0 }
  });

  const totalChapters = useMemo(
    () => data.reduce((sum, p) => sum + p.value, 0),
    [data]
  );

  const maxValue = useMemo(
    () => Math.max(...data.map((p) => p.value), 1),
    [data]
  );

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) }),
    transform: [{ scale: withTiming(isActive ? 1 : 0.95, { duration: 200, easing: Easing.out(Easing.ease) }) }],
  }));

  if (!data.length) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.text,
        },
      ]}
    >
      <Text
        style={[
          typography.bodyCaption,
          {
            color: colors.secondaryText,
            marginBottom: 12,
          },
        ]}
      >
        {t("stats.activity.chartTitle")}
      </Text>

      {/* Tooltip externe */}
      <Animated.View style={[styles.tooltipContainer, tooltipStyle]}>
        <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.accent, fontWeight: "600" }]}>
            {state.y.value.value.value.toFixed(0)} {t("stats.activity.chapters")}
          </Text>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
            {state.x.value.value}
          </Text>
        </View>
      </Animated.View>

      <View style={{ height: 240 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={data}
          xKey="label"
          yKeys={["value"]}
          chartPressState={state}
          axisOptions={{
            tickCount: {
              x: Math.min(data.length, 6),
              y: 5,
            },
            formatXLabel(label) {
              if (label == null) return "";
              const labelStr = String(label);
              // Format YYYY-MM to MM/YY
              const parts = labelStr.split("-");
              if (parts.length === 2) {
                return `${parts[1]}/${parts[0].slice(2)}`;
              }
              return labelStr;
            },
            labelColor: colors.secondaryText,
            font,
          }}
          domain={{
            y: [0, maxValue * 1.3],
          }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.value}
                color={hexToRgba(colors.accent, 0.9)}
                strokeWidth={2.5}
                curveType="natural"
                animate={{ type: "spring", duration: 800 }}
              />
              <Scatter
                points={points.value}
                color={colors.accent}
                radius={4}
                style="fill"
                animate={{ type: "spring", duration: 800 }}
              />
              {isActive && (
                <ChartTooltip
                  x={state.x.position}
                  y={state.y.value.position}
                  color={colors.accent}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
      <View style={styles.totalContainer}>
        <View style={[styles.totalBadge, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
          <Text
            style={[
              typography.caption,
              {
                color: colors.accent,
                fontWeight: "600",
              },
            ]}
          >
            {t("stats.activity.total", { count: totalChapters })}
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
