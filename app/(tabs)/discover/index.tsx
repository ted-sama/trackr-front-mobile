import React from "react"; // Removed useEffect
import { StyleSheet, ScrollView, ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategorySlider from "@/components/CategorySlider";
import HeaderDiscover from "@/components/discover/HeaderDiscover";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { Book } from "@/types/index";
import Toast from "react-native-toast-message";
import { useBookStore } from "../../store/bookStore"; // Adjusted path
import { useTrackingStore } from "../../store/trackingStore"; // Adjusted path
import { useFocusEffect } from '@react-navigation/native';

export default function Discover() {
  const { colors } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();

  const {
    categories,
    isLoadingCategories,
    errorCategories,
    fetchCategories,
  } = useBookStore();

  const {
    addTrackedBook,
    removeTrackedBook,
    // isUpdating, // Removed as it's not used in this component directly
    updateError,
  } = useTrackingStore();

  // Fetch categories when the screen comes into focus or on initial mount
  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const onTrackingToggleInDiscover = async (bookIdStr: string, isCurrentlyTracking: boolean, bookObject?: Book) => {
    if (!bookObject) {
      console.warn("Book object is missing in onTrackingToggleInDiscover");
      Toast.show({ type: 'error', text1: 'Erreur de suivi', text2: 'Données du livre manquantes.' });
      return;
    }

    const bookId = parseInt(bookIdStr, 10);

    try {
      if (isCurrentlyTracking) {
        await removeTrackedBook(bookId);
        Toast.show({
          text1: 'Livre retiré de votre bibliothèque',
          type: 'info',
        });
      } else {
        await addTrackedBook(bookObject); // addTrackedBook expects the full Book object
        Toast.show({
          text1: 'Livre ajouté à votre bibliothèque',
          type: 'info',
        });
      }
    } catch (err) {
      // Errors are now handled by the store and reflected in updateError[bookId]
      // Toast for specific error can be shown here if needed, or rely on global error display
      const specificError = updateError[bookId];
      console.warn(`Failed to toggle tracking for book ${bookId}:`, err, specificError);
      Toast.show({
        type: 'error',
        text1: 'Erreur de suivi',
        text2: specificError || `Impossible de mettre à jour le suivi du livre.`
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["right", "left"]}
    >
      <HeaderDiscover searchMode="navigate" />

      {isLoadingCategories ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorCategories ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{errorCategories}</Text>
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
              // Pass isUpdating and updateError for specific book if needed by CategorySlider/BookCard
              // For example, a book card within the slider might want to show a loading spinner
              // isUpdatingForBook={(bookId: number) => isUpdating[bookId]}
              // updateErrorForBook={(bookId: number) => updateError[bookId]}
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
