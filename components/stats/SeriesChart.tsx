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
        Répartition par longueur de série
      </Text>
      <View style={{ height: 210 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={distributionData}
          xKey={"label"}
          yKeys={["value"]}
          axisOptions={{
            tickCount: 5,
            labelColor: colors.secondaryText,
            font,
          }}
          viewport={{
            y: [
              0,
              Math.max(1, ...distributionData.map((p) => p.value || 0)) * 1.4,
            ],
          }}
        >
          {({ points, chartBounds }) => (
            <Bar
              chartBounds={chartBounds}
              points={points.value}
              barWidth={22}
              roundedCorners={{
                topLeft: 18,
                topRight: 18,
              }}
              color={hexToRgba(colors.accent, 0.9)}
            />
          )}
        </CartesianChart>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 4,
          paddingHorizontal: 8,
        }}
      >
        <Text
          style={[
            typography.bodyCaption,
            {
              color: colors.secondaryText,
              fontSize: 10,
            },
          ]}
        >
          Longueur →
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          {distributionData.map((d) => (
            <Text
              key={d.label}
              style={[
                typography.bodyCaption,
                { color: colors.secondaryText, fontSize: 11 },
              ]}
            >
              {d.label}: {d.value}
            </Text>
          ))}
        </View>
        <Text
          style={[
            typography.bodyCaption,
            {
              color: colors.secondaryText,
              fontSize: 10,
            },
          ]}
        >
          ↑ Séries
        </Text>
      </View>
      <View style={styles.seriesProgressList}>
        <Text
          style={[
            typography.caption,
            { color: colors.secondaryText, marginBottom: 8 },
          ]}
        >
          {t("stats.currentProgress")} — séries en cours
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
      </View>
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

