import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { hexToRgba } from "@/utils/colors";
import { StatsSection } from "./StatsSection";

interface AuthorData {
  label: string;
  value: number;
}

interface AuthorsChartProps {
  data: AuthorData[];
  title: string;
}

export function AuthorsChart({ data, title }: AuthorsChartProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  const topAuthors = useMemo(
    () => data.sort((a, b) => b.value - a.value).slice(0, 6),
    [data]
  );

  const maxValue = useMemo(
    () => Math.max(...topAuthors.map((a) => a.value)),
    [topAuthors]
  );

  if (!topAuthors.length) return null;

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
        Auteurs les plus lus (nombre de séries)
      </Text>
      <View style={styles.authorsList}>
        {topAuthors.map((author) => (
          <View key={author.label} style={styles.authorRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[typography.body, { color: colors.text }]}
                numberOfLines={1}
              >
                {author.label}
              </Text>
              <View style={styles.funnelBarBackground}>
                <View
                  style={[
                    styles.funnelBarFill,
                    {
                      width: `${(author.value / maxValue) * 100}%`,
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
              {author.value} {author.value > 1 ? "séries" : "série"}
            </Text>
          </View>
        ))}
      </View>
    </StatsSection>
  );
}

const styles = StyleSheet.create({
  authorsList: {
    gap: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
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

