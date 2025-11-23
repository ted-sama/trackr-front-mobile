import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";

interface FunnelCounts {
  reading: number;
  completed: number;
  on_hold: number;
  dropped: number;
}

interface FunnelChartProps {
  counts: FunnelCounts;
  title: string;
}

export function FunnelChart({ counts, title }: FunnelChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const total = useMemo(
    () => counts.reading + counts.completed + counts.on_hold + counts.dropped,
    [counts]
  );

  const funnelData = useMemo(
    () => [
      {
        label: t("status.reading", "Reading"),
        value: counts.reading,
        color: colors.reading,
      },
      {
        label: t("status.completed", "Completed"),
        value: counts.completed,
        color: colors.completed,
      },
      {
        label: t("status.onHold", "On hold"),
        value: counts.on_hold,
        color: colors.onHold,
      },
      {
        label: t("status.dropped", "Dropped"),
        value: counts.dropped,
        color: colors.dropped,
      },
    ],
    [counts, colors, t]
  );

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
        Répartition de vos séries par statut
      </Text>
      <View style={styles.funnelContainer}>
        {funnelData.map((item) => {
          const ratio = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <View key={item.label} style={styles.funnelRow}>
              <View
                style={[styles.funnelDot, { backgroundColor: item.color }]}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.body, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                <View style={styles.funnelBarBackground}>
                  <View
                    style={[
                      styles.funnelBarFill,
                      {
                        width: `${ratio}%`,
                        backgroundColor: hexToRgba(item.color, 0.9),
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
                {item.value} ({ratio.toFixed(0)}%)
              </Text>
            </View>
          );
        })}
      </View>
      <Text
        style={[
          typography.bodyCaption,
          {
            color: colors.secondaryText,
            textAlign: "center",
            marginTop: 12,
          },
        ]}
      >
        {total} séries suivies au total
      </Text>
    </StatsSection>
  );
}

const styles = StyleSheet.create({
  funnelContainer: {
    gap: 16,
  },
  funnelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  funnelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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

