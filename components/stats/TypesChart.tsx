import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { Pie, PolarChart } from "victory-native";
import { StatsSection } from "./StatsSection";
import { useTranslation } from "react-i18next";

// Palette de couleurs pour les différents types
const TYPE_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#0ea5e9", // sky
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
  title: string;
}

export function TypesChart({ data, title }: TypesChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const totalTypes = useMemo(
    () => data.reduce((sum, t) => sum + t.value, 0),
    [data]
  );

  const pieData: PieDataPoint[] = useMemo(
    () =>
      data.map((item, index) => ({
        label: item.label,
        value: item.value,
        color: TYPE_COLORS[index % TYPE_COLORS.length],
      })),
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
        {t("stats.types.chartTitle")}
      </Text>
      <View style={{ height: 220 }}>
        <PolarChart
          data={pieData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <Pie.Chart innerRadius="40%">
            {() => (
              <>
                <Pie.Slice />
                <Pie.SliceAngularInset
                  angularInset={{
                    angularStrokeWidth: 2,
                    angularStrokeColor: colors.background,
                  }}
                />
              </>
            )}
          </Pie.Chart>
        </PolarChart>
      </View>
      {/* Légende */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          marginTop: 12,
        }}
      >
        {pieData.map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.color,
              }}
            />
            <Text
              style={[
                typography.bodyCaption,
                {
                  color: colors.secondaryText,
                  fontSize: 11,
                },
              ]}
            >
              {item.label} ({item.value})
            </Text>
          </View>
        ))}
      </View>
    </StatsSection>
  );
}
