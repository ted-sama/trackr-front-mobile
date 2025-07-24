import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import BookCategoriesScreen from "./book-categories-screen";
import UserListsScreen from "./user-lists-screen";

const Tab = createMaterialTopTabNavigator();

export default function Discover() {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <HeaderDiscover searchMode="navigate" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.secondaryText,
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            borderRadius: 10,
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderColor: colors.tabBarBorder,
            borderBottomWidth: 1,
            height: 50,
          },
          tabBarLabelStyle: {
            ...typography.caption,
          },
          swipeEnabled: false,
          lazy: true,
          animationEnabled: true,
        }}
        
      >
        <Tab.Screen name="Livres" component={BookCategoriesScreen} />
        <Tab.Screen name="Listes" component={UserListsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
