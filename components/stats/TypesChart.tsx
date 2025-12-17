import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { Pie, PolarChart } from "victory-native";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "@/utils/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { BookType } from "lucide-react-native";

const TYPE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#0ea5e9",
];

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface PieDataPoint extends Record<string, unknown> {
  label: string;
  value: number;
  color: string;
}

interface TypesChartProps {
  data: SimplePoint[];
}

interface LegendItemProps {
  item: PieDataPoint;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  total: number;
  colors: any;
  typography: any;
  t: any;
}

function LegendItem({ item, index, isSelected, onPress, total, colors, typography, t }: LegendItemProps) {
  const progress = useSharedValue(0);
  const percentage = ((item.value / total) * 100).toFixed(1);

  useEffect(() => {
    progress.value = withDelay(index * 60, withSpring(1, { damping: 15, stiffness: 120 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.legendItem,
          {
            backgroundColor: isSelected ? hexToRgba(item.color, 0.15) : "transparent",
            borderColor: isSelected ? item.color : "transparent",
          },
          animatedStyle,
        ]}
      >
        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
        <View style={styles.legendTextContainer}>
          <Text
            style={[
              typography.bodyCaption,
              {
                color: isSelected ? colors.text : colors.secondaryText,
                fontSize: 11,
                fontWeight: isSelected ? "600" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {t("common.bookTypes." + item.label)}
          </Text>
          <Text
            style={[
              typography.bodyCaption,
              { color: item.color, fontSize: 10, fontWeight: "600" },
            ]}
          >
            {item.value} ({percentage}%)
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function TypesChart({ data }: TypesChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const totalTypes = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const pieData: PieDataPoint[] = useMemo(
    () => data.map((item, index) => ({
      label: item.label,
      value: item.value,
      color: TYPE_COLORS[index % TYPE_COLORS.length],
    })),
    [data]
  );

  const topType = useMemo(() => {
    if (!pieData.length) return null;
    return pieData.reduce((max, item) => (item.value > max.value ? item : max), pieData[0]);
  }, [pieData]);

  const tooltipOpacity = useSharedValue(selectedIndex !== null ? 1 : 0);

  useEffect(() => {
    tooltipOpacity.value = withTiming(selectedIndex !== null ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [selectedIndex]);

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: interpolate(tooltipOpacity.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) }],
  }));

  if (!data.length) return null;

  const selectedItem = selectedIndex !== null ? pieData[selectedIndex] : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
      <Text style={[typography.bodyCaption, { color: colors.secondaryText, marginBottom: 12 }]}>
        {t("stats.types.chartTitle")}
      </Text>

      <Animated.View style={[styles.tooltipContainer, tooltipStyle]}>
        {selectedItem && (
          <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.tooltipRow}>
              <View style={[styles.tooltipDot, { backgroundColor: selectedItem.color }]} />
              <Text style={[typography.caption, { color: colors.text, fontWeight: "600" }]}>
                {t("common.bookTypes." + selectedItem.label)}
              </Text>
            </View>
            <Text style={[typography.bodyCaption, { color: selectedItem.color, fontSize: 11, fontWeight: "600" }]}>
              {selectedItem.value} ({((selectedItem.value / totalTypes) * 100).toFixed(1)}%)
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.chartContainer}>
        <View style={{ height: 200, width: 200 }}>
          <PolarChart data={pieData} labelKey="label" valueKey="value" colorKey="color">
            <Pie.Chart innerRadius="45%">
              {() => (
                <>
                  <Pie.Slice />
                  <Pie.SliceAngularInset angularInset={{ angularStrokeWidth: 3, angularStrokeColor: colors.background }} />
                </>
              )}
            </Pie.Chart>
          </PolarChart>
        </View>
        <View style={styles.centerLabel}>
          <Text style={[typography.h2, { color: colors.text, fontSize: 24 }]}>{totalTypes}</Text>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
            {t("stats.types.total")}
          </Text>
        </View>
      </View>

      {topType && (
        <View style={styles.topBadgeContainer}>
          <View style={[styles.topBadge, { backgroundColor: hexToRgba(topType.color, 0.1) }]}>
            <BookType size={12} color={topType.color} />
            <Text style={[typography.bodyCaption, { color: topType.color, fontSize: 11, fontWeight: "600", marginLeft: 4 }]}>
              Top: {t("common.bookTypes." + topType.label)} ({((topType.value / totalTypes) * 100).toFixed(0)}%)
            </Text>
          </View>
        </View>
      )}

      <View style={styles.legendContainer}>
        {pieData.map((item, index) => (
          <LegendItem
            key={item.label}
            item={item}
            index={index}
            isSelected={selectedIndex === index}
            onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
            total={totalTypes}
            colors={colors}
            typography={typography}
            t={t}
          />
        ))}
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
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  topBadgeContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendTextContainer: {
    alignItems: "flex-start",
  },
});
