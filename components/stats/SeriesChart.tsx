import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { CartesianChart, Bar } from "victory-native";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";
import type { SkFont } from "@shopify/react-native-skia";
import type { SeriesProgress } from "@/types/stats";

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface SeriesChartProps {
  distributionData: SimplePoint[];
  currentProgress: SeriesProgress[];
  title: string;
  font: SkFont | null;
}

export function SeriesChart({
  distributionData,
  currentProgress,
  title,
  font,
}: SeriesChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  if (!distributionData.length) return null;

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
        {t("stats.series.chartTitle")}
      </Text>
      <View style={{ height: 210 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={distributionData.map((point) => ({
            ...point,
            // Map known label values to translation keys
            label:
              point.label === "oneshot"
                ? t("stats.series.oneshot")
                : point.label === "short"
                ? t("stats.series.short")
                : point.label === "medium"
                ? t("stats.series.medium")
                : point.label === "long"
                ? t("stats.series.long")
                : point.label,
          }))}
          xKey="label"
          yKeys={["value"]}
          axisOptions={{
            tickCount: {
              x: distributionData.length,
              y: Math.max(...distributionData.map((p) => p.value || 0)) * 1.4,
            },
            labelColor: colors.secondaryText,
            font,
          }}
          domain={{ y: [0, Math.max(...distributionData.map((p) => p.value || 0)) * 1.4] }}
          domainPadding={{ left: 30, right: 30 }}
        >
          {({ points, chartBounds }) => (
            <Bar
              chartBounds={chartBounds}
              points={points.value}
              barWidth={22}
              roundedCorners={{
                topLeft: 4,
                topRight: 4,
              }}
              color={hexToRgba(colors.accent, 0.9)}
              labels={{
                position: "top",
                font: font,
                color: colors.text,
              }}
            />
          )}
        </CartesianChart>
      </View>
      {/* <View style={styles.seriesProgressList}>
        <Text
          style={[
            typography.caption,
            { color: colors.secondaryText, marginBottom: 8 },
          ]}
        >
          {t("stats.currentProgress")} — {t("stats.series.currentProgress")}
        </Text>
        {currentProgress.length > 0 ? (
          currentProgress.map((serie) => (
            <View key={serie.title} style={styles.seriesRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.body, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {serie.title}
                </Text>
                <View style={styles.funnelBarBackground}>
                  <View
                    style={[
                      styles.funnelBarFill,
                      {
                        width: `${serie.percentage || 0}%`,
                        backgroundColor: hexToRgba(colors.accent, 0.9),
                      },
                    ]}
                  />
                </View>
              </View>
              <Text
                style={[
                  typography.caption,
                  { color: colors.secondaryText, marginLeft: 8 },
                ]}
              >
                {serie.read}
                {serie.total > 0 ? ` / ${serie.total}` : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text
            style={[
              typography.bodyCaption,
              { color: colors.secondaryText, textAlign: "center" },
            ]}
          >
            Aucune série en cours
          </Text>
        )}
      </View> */}
    </StatsSection>
  );
}

const styles = StyleSheet.create({
  seriesProgressList: {
    marginTop: 24,
  },
  seriesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  funnelBarBackground: {
    height: 8,
    backgroundColor: "rgba(100, 100, 100, 0.1)",
    borderRadius: 4,
    marginTop: 6,
    overflow: "hidden",
  },
  funnelBarFill: {
    height: "100%",
    borderRadius: 4,
  },
});

