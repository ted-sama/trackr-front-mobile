import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { LinearGradient } from "expo-linear-gradient";
import { hexToRgba } from "@/utils/colors";

interface StatsSectionProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function StatsSection({ title, subtitle, style, children }: StatsSectionProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <LinearGradient
            colors={[hexToRgba(colors.accent, 0.28), hexToRgba(colors.accent, 0.0)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.badgeBackground, { borderColor: hexToRgba(colors.accent, 0.4) }]}
          >
            <View style={[styles.badgeDot, { backgroundColor: colors.accent }]} />
            <Text style={[typography.caption, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          </LinearGradient>
          {subtitle ? (
            <Text
              style={[
                typography.caption,
                { color: colors.secondaryText, marginTop: 6 },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.08) }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  badgeBackground: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
});


