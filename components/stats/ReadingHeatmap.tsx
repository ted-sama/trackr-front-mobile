import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";
import type { HeatmapDataPoint } from "@/types/stats";
import { useTranslation } from "react-i18next";

interface ReadingHeatmapProps {
  data: HeatmapDataPoint[];
  title: string;
}

export function ReadingHeatmap({ data, title }: ReadingHeatmapProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const heatmapMatrix = React.useMemo(() => {
    const byDay: { [day: number]: { [hour: number]: number } } = {};
    let maxValue = 0;
    data.forEach((item) => {
      if (!byDay[item.day]) byDay[item.day] = {};
      byDay[item.day][item.hour] = item.value;
      if (item.value > maxValue) maxValue = item.value;
    });
    return {
      byDay,
      maxValue: maxValue || 1,
    };
  }, [data]);

  const days = ["L", "M", "M", "J", "V", "S", "D"];

  if (!data.length) return null;

  return (
    <StatsSection title={title}>
      <Text
        style={[
          typography.bodyCaption,
          {
            color: colors.secondaryText,
            marginBottom: 12,
          },
        ]}
      >
        {t("stats.heatmap.chartTitle")}
      </Text>
      <View style={styles.heatmapContainer}>
        {days.map((dayLabel, dayIndex) => (
          <View key={dayLabel + dayIndex} style={styles.heatmapRow}>
            <Text
              style={[
                typography.bodyCaption,
                { color: colors.secondaryText, width: 18 },
              ]}
            >
              {dayLabel}
            </Text>
            <View style={styles.heatmapRowBlocks}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const value = heatmapMatrix.byDay[dayIndex]?.[hour] ?? 0;
                const intensity = value / heatmapMatrix.maxValue;
                const backgroundColor =
                  intensity === 0
                    ? hexToRgba(colors.border, 0.5)
                    : hexToRgba(colors.accent, 0.2 + intensity * 0.6);
                return (
                  <View
                    key={`${dayIndex}-${hour}`}
                    style={[
                      styles.heatmapCell,
                      {
                        backgroundColor,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={[typography.bodyCaption, { color: colors.secondaryText }]}
        >
          {t("stats.heatmap.12am")}
        </Text>
        <Text
          style={[typography.bodyCaption, { color: colors.secondaryText }]}
        >
          {t("stats.heatmap.12pm")}
        </Text>
        <Text
          style={[typography.bodyCaption, { color: colors.secondaryText }]}
        >
          {t("stats.heatmap.11pm")}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
          gap: 8,
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: hexToRgba(colors.border, 0.5),
          }}
        />
        <Text
          style={[typography.bodyCaption, { color: colors.secondaryText }]}
        >
          {t("stats.heatmap.less")}
        </Text>
        <View style={{ flexDirection: "row", gap: 2 }}>
          {[0.3, 0.5, 0.7, 1].map((intensity, idx) => (
            <View
              key={idx}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: hexToRgba(colors.accent, 0.2 + intensity * 0.6),
              }}
            />
          ))}
        </View>
        <Text
          style={[typography.bodyCaption, { color: colors.secondaryText }]}
        >
          {t("stats.heatmap.more")}
        </Text>
      </View>
    </StatsSection>
  );
}

const styles = StyleSheet.create({
  heatmapContainer: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heatmapRowBlocks: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
  },
});
