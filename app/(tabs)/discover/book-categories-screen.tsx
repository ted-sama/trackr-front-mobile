import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Text, View, RefreshControl } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book } from "@/types/book";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useCategories } from '@/hooks/queries/categories';
import CategorySlider from "@/components/CategorySlider";

interface BookCategoriesScreenProps {}

export default function BookCategoriesScreen({}: BookCategoriesScreenProps) {
  const { colors } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { data: categories, isLoading, error, refetch, isFetching } = useCategories();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (categories) setHasLoadedOnce(true);
  }, [categories]);

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
      {(categories || []).map((category) => (
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