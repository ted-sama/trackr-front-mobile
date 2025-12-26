import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import {
  BookMarked,
  BookOpen,
  Flame,
  CheckCircle2,
  BookText,
  Star,
  type LucideIcon,
} from "lucide-react-native";

interface OverviewCard {
  key: string;
  label: string;
  title: string;
}

interface OverviewCardsProps {
  cards: OverviewCard[];
}

const CARD_ICONS: Record<string, LucideIcon> = {
  totalFollowed: BookMarked,
  chapters: BookOpen,
  streak: Flame,
  completed: CheckCircle2,
  reading: BookText,
  avgRating: Star,
};

const CARD_COLORS: Record<string, string> = {
  totalFollowed: "#6366f1",
  chapters: "#8b5cf6",
  streak: "#f97316",
  completed: "#22c55e",
  reading: "#0ea5e9",
  avgRating: "#eab308",
};

interface StatCardProps {
  card: OverviewCard;
  colors: any;
  typography: any;
}

function StatCard({ card, colors, typography }: StatCardProps) {
  const Icon = CARD_ICONS[card.key] || BookOpen;
  const iconColor = CARD_COLORS[card.key] || colors.accent;

  return (
    <View style={styles.overviewCard}>
      <View
        style={[
          styles.cardInner,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Icon size={20} color={iconColor} style={{ marginBottom: 8 }} />
        <Text style={[typography.h2, { color: colors.text, marginBottom: 2, fontSize: 22 }]} numberOfLines={1}>
          {card.title}
        </Text>
        <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 11 }]} numberOfLines={1}>
          {card.label}
        </Text>
      </View>
    </View>
  );
}

export function OverviewCards({ cards }: OverviewCardsProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={styles.overviewGrid}>
      {cards.map((card) => (
        <StatCard key={card.key} card={card} colors={colors} typography={typography} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  overviewCard: {
    flexBasis: "31%",
    flexGrow: 1,
  },
  cardInner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
});
