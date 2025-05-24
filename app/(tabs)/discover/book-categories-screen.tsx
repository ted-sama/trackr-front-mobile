import React, { useEffect } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book } from "@/types/index";
import Toast from "react-native-toast-message";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useCategoryStore, CategoryState } from '@/stores/categoryStore';
import CategorySlider from "@/components/CategorySlider";

interface BookCategoriesScreenProps {}

export default function BookCategoriesScreen({}: BookCategoriesScreenProps) {
  const { colors } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();

  const fetchCategories = useCategoryStore((state: CategoryState) => state.fetchCategories);
  const categoryIds = useCategoryStore((state: CategoryState) => state.allIds);
  const categoriesById = useCategoryStore((state: CategoryState) => state.categoriesById);
  const categories = categoryIds.map(id => categoriesById[id]);
  const isLoading = useCategoryStore((state: CategoryState) => state.isLoading);
  const error = useCategoryStore((state: CategoryState) => state.error);

  const { addTrackedBook: addTrackedBookToStore, removeTrackedBook: removeTrackedBookFromStore } = useTrackedBooksStore();

  const onTrackingToggleInDiscover = async (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => {
    if (!bookObject) {
      console.warn("Book object is missing in onTrackingToggleInDiscover");
      Toast.show({ type: 'error', text1: 'Erreur de suivi', text2: 'Données du livre manquantes.' });
      return;
    }

    if (isCurrentlyTracking) {
      try {
        await removeTrackedBookFromStore(parseInt(bookId, 10));
        Toast.show({
          text1: 'Livre retiré de votre bibliothèque',
          type: 'info',
        });
      } catch (err) {
        console.warn(`Failed to remove book ${bookId} from tracking:`, err);
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de retirer le livre.'});
      }
    } else {
      try {
        await addTrackedBookToStore(bookObject);
        Toast.show({
          text1: 'Livre ajouté à votre bibliothèque',
          type: 'info',
        });
      } catch (err) {
        console.warn(`Failed to add book ${bookId} to tracking:`, err);
        Toast.show({ type: 'error', text1: 'Erreur', text2: `Impossible d'ajouter le livre.` });
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
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
    >
      {categories.map((category) => (
        <CategorySlider
          key={category.id}
          category={category}
          isBottomSheetVisible={isBottomSheetVisible}
          onTrackingToggle={onTrackingToggleInDiscover}
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