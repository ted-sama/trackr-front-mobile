import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { CartesianChart, Bar } from "victory-native";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";
import type { SkFont } from "@shopify/react-native-skia";

interface SimplePoint extends Record<string, unknown> {
  label: string;
  value: number;
}

interface GenreChartProps {
  data: SimplePoint[];
  title: string;
  font: SkFont | null;
}

export function GenreChart({ data, title, font }: GenreChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  const totalGenres = useMemo(
    () => data.reduce((sum, g) => sum + g.value, 0),
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
        Nombre de séries par genre (top 7)
      </Text>
      <View style={{ height: 240 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={data}
          xKey={"label"}
          yKeys={["value"]}
          axisOptions={{
            tickCount: 5,
            labelColor: colors.secondaryText,
            font,
          }}
          viewport={{ y: [0, Math.max(...data.map((p) => p.value)) * 1.2] }}
        >
          {({ points, chartBounds }) => (
            <Bar
              chartBounds={chartBounds}
              points={points.value}
              barWidth={18}
              roundedCorners={{ topLeft: 12, topRight: 12 }}
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
          Genre →
        </Text>
        <Text
          style={[
            typography.bodyCaption,
            {
              color: colors.secondaryText,
              textAlign: "center",
            },
          ]}
        >
          {totalGenres} séries au total
        </Text>
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
    </StatsSection>
  );
}

