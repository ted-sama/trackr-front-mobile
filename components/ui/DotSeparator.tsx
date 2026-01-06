import React from "react";
import { Text, TextStyle, StyleProp } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface DotSeparatorProps {
  color?: string;
  style?: StyleProp<TextStyle>;
}

export default function DotSeparator({ color, style }: DotSeparatorProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        {
          fontWeight: "900",
          marginHorizontal: 4,
          color: color ?? colors.secondaryText,
        },
        style,
      ]}
    >
      ·
    </Text>
  );
}


