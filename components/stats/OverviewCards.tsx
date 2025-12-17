import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { hexToRgba } from "@/utils/colors";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
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

interface AnimatedCardProps {
  card: OverviewCard;
  index: number;
  colors: any;
  typography: any;
}

function AnimatedCard({ card, index, colors, typography }: AnimatedCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 80, withSpring(1, { damping: 15, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [0.9, 1], Extrapolation.CLAMP) },
    ],
  }));

  const Icon = CARD_ICONS[card.key] || BookOpen;
  const iconColor = CARD_COLORS[card.key] || colors.accent;

  return (
    <Animated.View style={[styles.overviewCard, animatedStyle]}>
      <View
        style={[
          styles.cardInner,
          {
            backgroundColor: colors.card,
            borderColor: hexToRgba(iconColor, 0.15),
            shadowColor: colors.text,
          },
        ]}
      >
        <LinearGradient
          colors={[hexToRgba(iconColor, 0.12), hexToRgba(iconColor, 0)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.iconContainer, { backgroundColor: hexToRgba(iconColor, 0.15) }]}>
          <Icon size={16} color={iconColor} />
        </View>
        <Text style={[typography.h2, { color: colors.text, marginBottom: 2, fontSize: 22 }]} numberOfLines={1}>
          {card.title}
        </Text>
        <Text style={[typography.bodyCaption, { color: colors.secondaryText, fontSize: 11 }]} numberOfLines={1}>
          {card.label}
        </Text>
      </View>
    </Animated.View>
  );
}

export function OverviewCards({ cards }: OverviewCardsProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={styles.overviewGrid}>
      {cards.map((card, index) => (
        <AnimatedCard key={card.key} card={card} index={index} colors={colors} typography={typography} />
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
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
});
