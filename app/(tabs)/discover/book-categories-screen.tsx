import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Text, View, RefreshControl } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book } from "@/types/book";
import Toast from "react-native-toast-message";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useCategoryStore, CategoryState } from '@/stores/categoryStore';
import CategorySlider from "@/components/CategorySlider";

interface BookCategoriesScreenProps {}

export default function BookCategoriesScreen({}: BookCategoriesScreenProps) {
  const { colors } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchCategories = useCategoryStore((state: CategoryState) => state.fetchCategories);
  const categoryIds = useCategoryStore((state: CategoryState) => state.allIds);
  const categoriesById = useCategoryStore((state: CategoryState) => state.categoriesById);
  const categories = categoryIds.map(id => categoriesById[id]);
  const isLoading = useCategoryStore((state: CategoryState) => state.isLoading);
  const error = useCategoryStore((state: CategoryState) => state.error);

  const { addTrackedBook: addTrackedBookToStore, removeTrackedBook: removeTrackedBookFromStore } = useTrackedBooksStore();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  // Tracking toggle now handled inside BookCard/BookListElement

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCategories();
      setHasLoadedOnce(true);
    };
    loadInitialData();
  }, [fetchCategories]);

  if (isLoading && !hasLoadedOnce && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !hasLoadedOnce) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isBottomSheetVisible}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {categories.map((category) => (
          <CategorySlider
          key={category.id}
          category={category}
          isBottomSheetVisible={isBottomSheetVisible}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 