import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import CategorySlider from "@/components/CategorySlider";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book, Category } from "@/types/index";

// Catégories fictives initiales
const FAKE_CATEGORIES_STRUCTURE: Omit<Category, 'books'>[] = [
  { id: 'news', title: 'Nouveautés' },
  { id: 'popular', title: 'Populaires' },
  { id: 'recommended', title: 'Recommandés' },
];

// Composant principal pour la page Discover
export default function Discover() {
  const { colors, currentTheme } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assurez-vous que votre simulateur/appareil peut accéder à localhost.
        // Sur Android, cela pourrait être http://10.0.2.2:3000
        // Sur iOS Simulator, localhost fonctionne généralement.
        const response = await fetch('https://0a2c-89-221-127-193.ngrok-free.app/api/books');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const booksData: Book[] = await response.json();

        // Peupler les catégories fictives avec les données récupérées
        const populatedCategories: Category[] = FAKE_CATEGORIES_STRUCTURE.map(cat => ({
          ...cat,
          books: booksData,
        }));

        setCategories(populatedCategories);
      } catch (e: any) {
        console.error("Failed to fetch books:", e);
        setError("Impossible de charger les livres. Vérifiez votre connexion ou l'API.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Le tableau vide assure que l'effet ne s'exécute qu'au montage

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <HeaderDiscover />

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
