import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import CategorySlider from "@/components/CategorySlider";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book, Category, BookTracking } from "@/types/index";
import { addBookToTracking, getCategories, removeBookFromTracking } from "@/api";
import Toast from "react-native-toast-message";
import { useTrackedBooksStore } from "@/state/tracked-books-store";

// Composant principal pour la page Discover
export default function Discover() {
  const { colors, currentTheme } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { addTrackedBook: addTrackedBookToStore, removeTrackedBook: removeTrackedBookFromStore } = useTrackedBooksStore();

  const onTrackingToggleInDiscover = async (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => {
    if (!bookObject) {
      console.warn("Book object is missing in onTrackingToggleInDiscover");
      Toast.show({ type: 'error', text1: 'Erreur de suivi', text2: 'Données du livre manquantes.' });
      return;
    }

    if (isCurrentlyTracking) {
      try {
        await removeBookFromTracking(bookId);
        removeTrackedBookFromStore(parseInt(bookId, 10));
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
        const trackingStatus: any = await addBookToTracking(bookId);
        addTrackedBookToStore({ ...bookObject, tracking: true, tracking_status: trackingStatus.book_tracking });
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData.items);
    } catch (e: any) {
      console.error("Failed to fetch books:", e);
      setError("Impossible de charger les livres. Vérifiez votre connexion ou l'API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <HeaderDiscover searchMode="navigate" />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
