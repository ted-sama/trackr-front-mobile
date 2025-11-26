import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { CartesianChart, Bar } from "victory-native";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";
import type { SkFont } from "@shopify/react-native-skia";
import { useTranslation } from "react-i18next";

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface RatingChartProps {
  data: SimplePoint[];
  title: string;
  font: SkFont | null;
}

export function RatingChart({ data, title, font }: RatingChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const totalRatings = useMemo(
    () => data.reduce((sum, r) => sum + r.value, 0),
    [data]
  );

  if (!data.length) return null;

  return (
    <StatsSection title={title} plusBadge={true}>
      <Text
        style={[
          typography.bodyCaption,
          {
            color: colors.secondaryText,
            marginBottom: 12,
          },
        ]}
      >
        {t("stats.ratings.chartTitle")}
      </Text>
      <View style={{ height: 220 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={data}
          xKey={"label"}
          yKeys={["value"]}
          axisOptions={{
            tickCount: {
              x: data.length,
              y: Math.max(...data.map((p) => p.value)) * 1.2,
            },
            labelColor: colors.secondaryText,
            font,
          }}
          domainPadding={{ left: 30, right: 30 }}
          domain={{ y: [0, Math.max(...data.map((p) => p.value)) * 1.2] }}
        >
          {({ points, chartBounds }) => (
            <Bar
              chartBounds={chartBounds}
              points={points.value}
              barWidth={16}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
              color={hexToRgba(colors.accent, 0.9)}
              animate={{ type: "timing", duration: 600 }}
              labels={{
                position: "top",
                font: font,
                color: colors.text,
              }}
            />
          )}
        </CartesianChart>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <Text
          style={[
            typography.bodyCaption,
            {
              color: colors.secondaryText,
              textAlign: "center",
            },
          ]}
        >
          {t("stats.ratings.total", { count: totalRatings })}
        </Text>
      </View>
    </StatsSection>
  );
}

