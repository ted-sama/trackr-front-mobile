import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { hexToRgba } from "@/utils/colors";
import type { HeatmapDataPoint } from "@/types/stats";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react-native";

interface ReadingHeatmapProps {
  data: HeatmapDataPoint[];
}

interface SelectedCell {
  day: number;
  hour: number;
  value: number;
}

const DAY_NAMES_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatHour(hour: number): string {
  if (hour === 0) return "00h";
  if (hour === 12) return "12h";
  return `${hour}h`;
}

interface HeatmapCellProps {
  value: number;
  maxValue: number;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}

function HeatmapCell({ value, maxValue, isSelected, onPress, colors }: HeatmapCellProps) {
  const intensity = value / maxValue;
  const backgroundColor = intensity === 0
    ? hexToRgba(colors.border, 0.5)
    : hexToRgba(colors.accent, 0.2 + intensity * 0.6);

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={[
          styles.heatmapCell,
          {
            backgroundColor,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? colors.text : "transparent",
          },
        ]}
      />
    </Pressable>
  );
}

export function ReadingHeatmap({ data }: ReadingHeatmapProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const heatmapMatrix = React.useMemo(() => {
    const byDay: { [day: number]: { [hour: number]: number } } = {};
    let maxValue = 0;
    data.forEach((item) => {
      if (!byDay[item.day]) byDay[item.day] = {};
      byDay[item.day][item.hour] = item.value;
      if (item.value > maxValue) maxValue = item.value;
    });
    return { byDay, maxValue: maxValue || 1 };
  }, [data]);

  const peakTime = React.useMemo(() => {
    let maxDay = 0, maxHour = 0, maxVal = 0;
    data.forEach((item) => {
      if (item.value > maxVal) {
        maxVal = item.value;
        maxDay = item.day;
        maxHour = item.hour;
      }
    });
    return { day: maxDay, hour: maxHour, value: maxVal };
  }, [data]);

  const dayLabels = ["L", "M", "M", "J", "V", "S", "D"];

  const handleCellPress = useCallback((dowValue: number, hour: number) => {
    const value = heatmapMatrix.byDay[dowValue]?.[hour] ?? 0;
    setSelectedCell((prev) =>
      prev?.day === dowValue && prev?.hour === hour ? null : { day: dowValue, hour, value }
    );
  }, [heatmapMatrix.byDay]);

  if (!data.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[typography.bodyCaption, { color: colors.secondaryText, marginBottom: 12 }]}>
        {t("stats.heatmap.chartTitle")}
      </Text>

      {selectedCell && (
        <View style={styles.tooltipContainer}>
          <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.tooltipRow}>
              <Clock size={14} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.accent, fontWeight: "600", marginLeft: 4 }]}>
                {DAY_NAMES_FULL[selectedCell.day]} {formatHour(selectedCell.hour)}
              </Text>
            </View>
            <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
              {selectedCell.value} {t("stats.heatmap.activities")}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.heatmapContainer}>
        {DAY_ORDER.map((dowValue, displayIndex) => (
          <View key={`day-${dowValue}`} style={styles.heatmapRow}>
            <Text style={[typography.bodyCaption, { color: colors.secondaryText, width: 18, fontSize: 10 }]}>
              {dayLabels[displayIndex]}
            </Text>
            <View style={styles.heatmapRowBlocks}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const value = heatmapMatrix.byDay[dowValue]?.[hour] ?? 0;
                const isSelected = selectedCell?.day === dowValue && selectedCell?.hour === hour;
                return (
                  <HeatmapCell
                    key={`${dowValue}-${hour}`}
                    value={value}
                    maxValue={heatmapMatrix.maxValue}
                    isSelected={isSelected}
                    onPress={() => handleCellPress(dowValue, hour)}
                    colors={colors}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.timeLabels}>
        <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
          {t("stats.heatmap.12am")}
        </Text>
        <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
          {t("stats.heatmap.12pm")}
        </Text>
        <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
          {t("stats.heatmap.11pm")}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.legendContainer}>
          <View style={[styles.legendCell, { backgroundColor: hexToRgba(colors.border, 0.5) }]} />
          <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
            {t("stats.heatmap.less")}
          </Text>
          <View style={styles.legendGradient}>
            {[0.3, 0.5, 0.7, 1].map((intensity, idx) => (
              <View
                key={idx}
                style={[styles.legendCell, { backgroundColor: hexToRgba(colors.accent, 0.2 + intensity * 0.6) }]}
              />
            ))}
          </View>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 10 }]}>
            {t("stats.heatmap.more")}
          </Text>
        </View>

        {peakTime.value > 0 && (
          <View style={[styles.peakBadge, { backgroundColor: hexToRgba(colors.accent, 0.1) }]}>
            <Text style={[typography.bodyCaption, { color: colors.accent, fontSize: 10, fontWeight: "600" }]}>
              Peak: {DAY_NAMES_FULL[peakTime.day].slice(0, 3)} {formatHour(peakTime.hour)}
            </Text>
          </View>
        )}
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
  heatmapContainer: {
    gap: 3,
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heatmapRowBlocks: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 24,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendGradient: {
    flexDirection: "row",
    gap: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  peakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
