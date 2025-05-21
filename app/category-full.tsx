import React, { useRef, useState, useEffect } from "react";
import { View, Text, Platform, StyleSheet, Pressable } from "react-native";
import { LegendList, LegendListRef } from "@legendapp/list";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import BookListElement from "@/components/BookListElement";
import BookCard from "@/components/BookCard";
import { Book, Category, BookTracking } from "@/types";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { addBookToTracking, removeBookFromTracking } from "@/api";
import Toast from "react-native-toast-message";
import ExpandableDescription from "@/components/ExpandableDescription";
import { useCategoryStore } from "@/stores/categoryStore";
import type { CategoryState } from "@/stores/categoryStore";

// AsyncStorage key for layout preference
const LAYOUT_STORAGE_KEY = "@MyApp:layoutPreference";

// Default layout preference
const DEFAULT_LAYOUT = "list";

const AnimatedList = Animated.createAnimatedComponent(LegendList<Book>);

export default function CategoryFull() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<LegendListRef | null>(null);
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">(
    DEFAULT_LAYOUT as "grid" | "list"
  );

  const {
    addTrackedBook: addTrackedBookToStore,
    removeTrackedBook: removeTrackedBookFromStore,
  } = useTrackedBooksStore();

  const category = useCategoryStore((state: CategoryState) => state.categoriesById[id as string] || null);
  const fetchCategory = useCategoryStore((state: CategoryState) => state.fetchCategory);
  const [isBlurVisible, setIsBlurVisible] = useState(false);
  const blurOpacity = useSharedValue(0);

  // Animated opacity for blur
  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  useEffect(() => {
    if (id) fetchCategory(id as string);
  }, [id]);

  // Load layout preference
  useEffect(() => {
    const loadLayoutPreference = async () => {
      const storedLayout = (await AsyncStorage.getItem(LAYOUT_STORAGE_KEY)) as
        | "grid"
        | "list";
      if (storedLayout) setCurrentLayout(storedLayout);
    };
    loadLayoutPreference();
  }, []);

  // Save layout preference
  useEffect(() => {
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, currentLayout);
  }, [currentLayout]);

  const handleBack = () => {
    router.back();
  };

  const onTrackingToggleInCategory = async (
    bookId: string,
    isCurrentlyTracking: boolean,
    bookObject?: Book
  ) => {
    if (!bookObject) {
      console.warn("Book object is missing in onTrackingToggleInDiscover");
      Toast.show({
        type: "error",
        text1: "Erreur de suivi",
        text2: "Données du livre manquantes.",
      });
      return;
    }

    if (isCurrentlyTracking) {
      try {
        await removeBookFromTracking(bookId);
        removeTrackedBookFromStore(parseInt(bookId, 10));
        Toast.show({
          text1: "Livre retiré de votre bibliothèque",
          type: "info",
        });
      } catch (err) {
        console.warn(`Failed to remove book ${bookId} from tracking:`, err);
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de retirer le livre.",
        });
      }
    } else {
      try {
        const trackingStatus: any = await addBookToTracking(bookId);
        addTrackedBookToStore({
          ...bookObject,
          tracking: true,
          tracking_status: trackingStatus.book_tracking,
        });
        Toast.show({
          text1: "Livre ajouté à votre bibliothèque",
          type: "info",
        });
      } catch (err) {
        console.warn(`Failed to add book ${bookId} to tracking:`, err);
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: `Impossible d'ajouter le livre.`,
        });
      }
    }
  };

  const switchLayout = () => {
    setIsBlurVisible(true);
    blurOpacity.value = 1;
    setTimeout(() => {
      blurOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(setIsBlurVisible)(false);
      });
    }, 50);
    setCurrentLayout(currentLayout === "grid" ? "list" : "grid");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={category?.title || "Catégorie"}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      {category && (
        <AnimatedList
          ref={scrollRef}
          data={category.books}
          key={currentLayout}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            marginTop: insets.top,
            paddingHorizontal: 16,
            paddingBottom: 64,
            flexGrow: 1,
          }}
          numColumns={currentLayout === "grid" ? 3 : 1}
          onScroll={scrollHandler}
          recycleItems
          ListHeaderComponent={
            <View>
              <View
                style={styles.header}
                onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
              >
                <Text
                  style={[
                    typography.h1,
                    { color: colors.text, maxWidth: "80%" },
                  ]}
                  accessibilityRole="header"
                  accessibilityLabel={category.title}
                  numberOfLines={1}
                >
                  {category.title}
                </Text>
                <SwitchLayoutButton
                  onPress={switchLayout}
                  currentView={currentLayout}
                />
              </View>
              {category.description && (
                <View style={{ marginBottom: 32 }}>
                  <ExpandableDescription text={category.description} textStyle={{ color: colors.secondaryText }} />
                </View>
              )}
            </View>
          }
          renderItem={({ item }) =>
            currentLayout === "grid" ? (
              <View style={{ width: "33%" }}>
                <BookCard
                  book={item}
                  onPress={() => {
                    router.push(`/book/${item.id}`);
                  }}
                  size="compact"
                  onTrackingToggle={onTrackingToggleInCategory}
                />
              </View>
            ) : (
              <BookListElement
                book={item}
                onPress={() => {
                  router.push(`/book/${item.id}`);
                }}
                showRating
                showAuthor
                showTrackingButton
                onTrackingToggle={onTrackingToggleInCategory}
              />
            )
          }
          ItemSeparatorComponent={
            currentLayout === "grid"
              ? () => <View style={{ height: 26 }} />
              : () => <View style={{ height: 12 }} />
          }
          ListEmptyComponent={
            category.books.length === 0 ? (
              <Text
                style={{
                  color: colors.secondaryText,
                  textAlign: "center",
                  marginTop: 32,
                }}
              >
                Aucun livre trouvé dans cette catégorie.
              </Text>
            ) : null
          }
          columnWrapperStyle={currentLayout === "grid" ? { gap: 4 } : undefined}
          onEndReached={() => {}}
          onEndReachedThreshold={0.2}
          ListFooterComponent={null}
          showsVerticalScrollIndicator={true}
          accessibilityRole="list"
        />
      )}
      {isBlurVisible && (
        <Animated.View
          style={[StyleSheet.absoluteFill, animatedBlurStyle, { zIndex: 10 }]}
          pointerEvents="none"
        >
          <BlurView
            intensity={40}
            tint={currentTheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 70 : 70,
    marginBottom: 16,
  },
});
