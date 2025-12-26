import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { Pie, PolarChart } from "victory-native";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "@/utils/colors";
import { useTranslateGenre } from "@/hooks/queries/genres";
import { Tag } from "lucide-react-native";

const GENRE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#0ea5e9", "#06b6d4", "#10b981",
  "#ef4444", "#e11d48",
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

interface GenreChartProps {
  data: SimplePoint[];
}

interface LegendItemProps {
  item: PieDataPoint;
  isSelected: boolean;
  onPress: () => void;
  total: number;
  colors: any;
  typography: any;
}

function LegendItem({ item, isSelected, onPress, total, colors, typography }: LegendItemProps) {
  const percentage = ((item.value / total) * 100).toFixed(1);

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.legendItem,
          {
            backgroundColor: isSelected ? hexToRgba(item.color, 0.15) : "transparent",
            borderColor: isSelected ? item.color : "transparent",
          },
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
            {item.label}
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
      </View>
    </Pressable>
  );
}

export function GenreChart({ data }: GenreChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const translateGenre = useTranslateGenre();

  const totalGenres = useMemo(() => data.reduce((sum, g) => sum + g.value, 0), [data]);

  const pieData: PieDataPoint[] = useMemo(
    () => data.map((item, index) => ({
      label: translateGenre(item.label),
      value: item.value,
      color: GENRE_COLORS[index % GENRE_COLORS.length],
    })),
    [data, translateGenre]
  );

  const topGenre = useMemo(() => {
    if (!pieData.length) return null;
    return pieData.reduce((max, item) => (item.value > max.value ? item : max), pieData[0]);
  }, [pieData]);

  if (!data.length) return null;

  const selectedItem = selectedIndex !== null ? pieData[selectedIndex] : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[typography.bodyCaption, { color: colors.secondaryText, marginBottom: 12 }]}>
        {t("stats.genres.chartTitle")}
      </Text>

      {selectedItem && (
        <View style={styles.tooltipContainer}>
          <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.tooltipRow}>
              <View style={[styles.tooltipDot, { backgroundColor: selectedItem.color }]} />
              <Text style={[typography.caption, { color: colors.text, fontWeight: "600" }]}>
                {selectedItem.label}
              </Text>
            </View>
            <Text style={[typography.bodyCaption, { color: selectedItem.color, fontSize: 11, fontWeight: "600" }]}>
              {selectedItem.value} ({((selectedItem.value / totalGenres) * 100).toFixed(1)}%)
            </Text>
          </View>
        </View>
      )}

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
          <Text style={[typography.h2, { color: colors.text, fontSize: 24 }]}>{totalGenres}</Text>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
            {t("stats.genres.total")}
          </Text>
        </View>
      </View>

      {topGenre && (
        <View style={styles.topBadgeContainer}>
          <View style={[styles.topBadge, { backgroundColor: hexToRgba(topGenre.color, 0.1) }]}>
            <Tag size={12} color={topGenre.color} />
            <Text style={[typography.bodyCaption, { color: topGenre.color, fontSize: 11, fontWeight: "600", marginLeft: 4 }]}>
              Top: {topGenre.label} ({((topGenre.value / totalGenres) * 100).toFixed(0)}%)
            </Text>
          </View>
        </View>
      )}

      <View style={styles.legendContainer}>
        {pieData.map((item, index) => (
          <LegendItem
            key={item.label}
            item={item}
            isSelected={selectedIndex === index}
            onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
            total={totalGenres}
            colors={colors}
            typography={typography}
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
    borderWidth: 1,
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
