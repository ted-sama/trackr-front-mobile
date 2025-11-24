import React, { useMemo, useEffect } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { CartesianChart, Line, Scatter } from "victory-native";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";
import type { SkFont } from "@shopify/react-native-skia";
import { useTranslation } from "react-i18next";

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface ActivityChartProps {
  data: SimplePoint[];
  title: string;
  font: SkFont | null;
}

export function ActivityChart({ data, title, font }: ActivityChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  useEffect(() => {
    // Add a default point if data is not empty for visualization smoothing
    if (data.length > 0) {
      data = [...data, { label: "2025-12", value: 566 }];
    }

    console.log("ActivityChart data", data);
  }, [data]);

  const totalChapters = useMemo(
    () => data.reduce((sum, p) => sum + p.value, 0),
    [data]
  );

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
        {t("stats.activity.chartTitle")}
      </Text>
      <View style={{ height: 240 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={data}
          xKey={"label"}
          yKeys={["value"]}
          axisOptions={{
            tickCount: {
                x: data.length,
                y: 10,
            },
            tickValues: {
                x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                y: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
            },
            formatXLabel(label) {
                if (!label) return "";
                return label;
            },
            labelColor: colors.secondaryText,
            font,
          }}
          viewport={{
            y: [0, Math.max(...data.map((p) => p.value)) * 1.2],
          }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.value}
                color={hexToRgba(colors.accent, 0.9)}
                strokeWidth={2}
                curveType="natural"
                animate={{ type: "timing", duration: 650 }}
              />
              <Scatter
                points={points.value}
                color={hexToRgba(colors.primary, 0.9)}
                radius={4}
                animate={{ type: "timing", duration: 650 }}
              />
            </>
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
          {t("stats.activity.total", { count: totalChapters })}
        </Text>
      </View>
    </StatsSection>
  );
}

