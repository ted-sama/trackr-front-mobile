import React from "react";
import { FlatList, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import Badge from "./ui/Badge";

interface BadgeSliderProps {
  data: string[];
  onPress?: (item: string) => void;
}

export default function BadgeSlider({ data, onPress }: BadgeSliderProps) {
  const { colors } = useTheme();

  return (
    <FlatList
      data={data}
      horizontal
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <Badge
          key={item}
          text={item}
          color={colors.badgeText}
          backgroundColor={colors.badgeBackground}
          borderColor={colors.badgeBorder}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ width: 4 }} />}
    />
  );
}
