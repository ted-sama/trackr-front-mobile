import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { StatsSection } from "./StatsSection";

interface OverviewCard {
  key: string;
  label: string;
  title: string;
}

interface OverviewCardsProps {
  cards: OverviewCard[];
  title: string;
}

export function OverviewCards({ cards, title }: OverviewCardsProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <StatsSection title={title}>
      <View style={styles.overviewGrid}>
        {cards.map((card) => (
          <View
            key={card.key}
            style={[
              styles.overviewCard,
            ]}
          >
            <Text
              style={[
                typography.bodyCaption,
                { color: colors.secondaryText, marginBottom: 4 },
              ]}
              numberOfLines={1}
            >
              {card.label}
            </Text>
            <Text
              style={[
                typography.h2,
                { color: colors.text, marginBottom: 4 },
              ]}
              numberOfLines={1}
            >
              {card.title}
            </Text>
          </View>
        ))}
      </View>
    </StatsSection>
  );
}

const styles = StyleSheet.create({
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: "30%",
    padding: 2,
  },
});

