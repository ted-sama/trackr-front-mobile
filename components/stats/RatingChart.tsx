import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { CartesianChart, Line } from "victory-native";
import { StatsSection } from "./StatsSection";
import type { SkFont } from "@shopify/react-native-skia";

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

  const totalRatings = useMemo(
    () => data.reduce((sum, r) => sum + r.value, 0),
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
        Distribution des notes attribuées (étoiles)
      </Text>
      <View style={{ height: 220 }}>
        <CartesianChart<SimplePoint, "label", "value">
          data={data}
          xKey={"label"}
          yKeys={["value"]}
          axisOptions={{
            tickCount: 4,
            labelColor: colors.secondaryText,
            font,
          }}
          viewport={{ y: [0, Math.max(...data.map((p) => p.value)) * 1.4] }}
        >
          {({ points }) => (
            <Line
              points={points.value}
              color={colors.accent}
              strokeWidth={3}
              animate={{ type: "timing", duration: 600 }}
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
          Note ★ →
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
          {totalRatings} séries notées
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
          ↑ Nombre
        </Text>
      </View>
    </StatsSection>
  );
}

