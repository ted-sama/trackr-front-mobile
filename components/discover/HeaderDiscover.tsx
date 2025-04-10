import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import Search from "@/components/discover/Search";

export default function HeaderDiscover() {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, height: 72 + insets.top, backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <StatusBar barStyle={currentTheme === "dark" ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Search placeholder="Commencez votre recherche" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
