import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { ReadingList } from "@/types";

interface CollectionListElementProps {
  list: ReadingList;
  onPress: () => void;
}

export default function CollectionListElement({ list, onPress }: CollectionListElementProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <Pressable onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 80, height: 80, backgroundColor: colors.card, borderRadius: 6 }}> 
        </View>
        <Text style={[typography.h3, { color: colors.text }]}>{list.name}</Text>
      </View>
    </Pressable>
  );
}
