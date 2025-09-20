import { Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";

export default function PlusBadge() {
  const { colors } = useTheme();
  const typography = useTypography();

  return <Text style={[typography.plusBadge, styles.plusBadge, { backgroundColor: colors.accent }]}>PLUS</Text>;
}

const styles = StyleSheet.create({
  plusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "white",
  },
});