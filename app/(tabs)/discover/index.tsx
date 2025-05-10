import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";

import CategorySlider from "@/components/CategorySlider";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book, Category } from "@/types/index";
import { addBookToTracking, checkIfBookIsTracked, getBooks, getCategories, removeBookFromTracking } from "@/api";
import Toast from "react-native-toast-message";

// Composant principal pour la page Discover
export default function Discover() {
  const { colors, currentTheme } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onTrackingToggle = async (bookId: string, isTracking: boolean) => {
    if (isTracking) {
      try {
        await removeBookFromTracking(bookId.toString());
        Toast.show({
          text1: 'Livre retiré de votre bibliothèque',
          type: 'info',
        });
      } catch (error) {
        console.warn(`Failed to remove book ${bookId} from tracking:`, error);
      }
    } else {
      try {
        await addBookToTracking(bookId.toString());
        Toast.show({
          text1: 'Livre ajouté à votre bibliothèque',
          type: 'info',
        });
      } catch (error) {
        console.warn(`Failed to add book ${bookId} to tracking:`, error);
      }
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData.items);
      for (const category of categoriesData.items) {
        if (category.books && category.books.length > 0) {
          const trackedPromises = category.books.map(async (book) => {
            try {
              const isTracked = await checkIfBookIsTracked(book.id.toString());
              return { ...book, tracking: isTracked };
            } catch (error) {
              console.warn(`Failed to check tracking status for book ${book.id}:`, error);
              return book;
            }
          });
          const updatedBooks = await Promise.all(trackedPromises);
          category.books = updatedBooks;
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch books:", e);
      setError("Impossible de charger les livres. Vérifiez votre connexion ou l'API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
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
              onTrackingToggle={onTrackingToggle}
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
