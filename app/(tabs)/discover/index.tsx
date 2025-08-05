import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import BookCategoriesScreen from "./book-categories-screen";
import UserListsScreen from "./user-lists-screen";

type TabType = 'books' | 'lists';

export default function Discover() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('books');

  const renderContent = () => {
    switch (activeTab) {
      case 'books':
        return <BookCategoriesScreen />;
      case 'lists':
        return <UserListsScreen />;
      default:
        return <BookCategoriesScreen />;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <HeaderDiscover 
        searchMode="navigate" 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
