import React, { useEffect } from "react"; // Removed useState, useCallback
import { StyleSheet, ScrollView, ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// import { StatusBar } from "expo-status-bar"; // StatusBar not used
import CategorySlider from "@/components/CategorySlider";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book, Category } from "@/types/index"; // Removed BookTracking as it's not directly used here
// Removed: addBookToTracking, getCategories, removeBookFromTracking from "@/api"
import Toast from "react-native-toast-message";
import { useTrackedBooksStore } from "@/state/tracked-books-store";
import { useCategoriesStore } from "@/state/categoriesStore"; // Added

// Composant principal pour la page Discover
export default function Discover() {
  const { colors } = useTheme(); // currentTheme not used
  const { isBottomSheetVisible } = useBottomSheet();

  // Categories Store Integration
  const { categories, isLoadingList, errorList, fetchAllCategories } = useCategoriesStore();
  
  // Tracked Books Store Integration for actions
  const { trackBook, untrackBook } = useTrackedBooksStore();

  const onTrackingToggleInDiscover = async (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => {
    // bookObject is passed but trackBook action in store currently only uses bookId.
    // If bookObject is crucial for efficiency, trackBook action would need an update.
    // For now, we proceed with the current store action signature.
    if (!bookObject) { // Still good to have this check for clarity, even if bookObject isn't directly used by trackBook(bookId)
      console.warn("Book object is missing in onTrackingToggleInDiscover");
      Toast.show({ type: 'error', text1: 'Erreur de suivi', text2: 'Données du livre manquantes.' });
      return;
    }

    try {
      if (isCurrentlyTracking) {
        await untrackBook(bookId); // Assumes bookId is the string ID the store expects
        Toast.show({
          text1: 'Livre retiré de votre bibliothèque',
          type: 'info',
        });
      } else {
        await trackBook(bookId); // Assumes bookId is the string ID the store expects
        Toast.show({
          text1: 'Livre ajouté à votre bibliothèque',
          type: 'info',
        });
      }
    } catch (err) {
      console.warn(`Failed to update tracking for book ${bookId}:`, err);
      const action = isCurrentlyTracking ? "retirer" : "d'ajouter";
      Toast.show({ type: 'error', text1: 'Erreur', text2: `Impossible de ${action} le livre.`});
    }
  };

  // fetchData removed

  useEffect(() => {
    // fetchAllCategories(); // Original plan
    useCategoriesStore.getState().fetchAllCategories(); // Ensures it's called once on mount
  }, []); // Empty dependency array is correct here when using getState()

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <HeaderDiscover searchMode="navigate" />

      {isLoadingList ? ( // Use isLoadingList from store
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorList ? ( // Use errorList from store
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{errorList}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isBottomSheetVisible}
        >
          {categories.map((category) => ( // Use categories from store
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
