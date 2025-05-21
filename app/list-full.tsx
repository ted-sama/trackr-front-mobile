import React, { useRef, useState, useEffect } from "react";
import { View, Text, Platform, StyleSheet, Image } from "react-native";
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
import { Book, ReadingList } from "@/types"; // Removed BookTracking
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTrackedBooksStore } from "@/state/tracked-books-store";
import { useListsStore } from "@/state/listsStore"; // Added
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
// Removed: getMyLists, addBookToTracking, removeBookFromTracking, getList from "@/api"
import Toast from "react-native-toast-message";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";

// AsyncStorage key for layout preference
const LAYOUT_STORAGE_KEY = "@MyApp:layoutPreference";
// Default layout preference
const DEFAULT_LAYOUT = "list";

const AnimatedList = Animated.createAnimatedComponent(LegendList<Book>);

export default function ListFull() {
  const { id: listId } = useLocalSearchParams<{ id: string }>(); // Renamed for clarity
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
  const [currentLayout, setCurrentLayout] =
    useState<"grid" | "list">(DEFAULT_LAYOUT as "grid" | "list");

  // Lists Store Integration
  const list = useListsStore(state => listId ? state.detailedLists[listId] : null);
  const isLoading = useListsStore(state => listId ? (state.isLoadingDetail[listId] ?? true) : true);
  const error = useListsStore(state => listId ? state.errorDetail[listId] : null);
  const fetchListById = useListsStore(state => state.fetchListById);

  // Tracked Books Store Integration for actions
  const { trackBook, untrackBook } = useTrackedBooksStore();
  
  // const [list, setList] = useState<ReadingList | null>(null); // Removed
  const [isBlurVisible, setIsBlurVisible] = useState(false); // UI state, keep
  const blurOpacity = useSharedValue(0); // UI state, keep

  // Animated opacity for blur
  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  useEffect(() => {
    if (listId) {
      fetchListById(listId);
    }
  }, [listId, fetchListById]);

  // Load layout preference
  useEffect(() => {
    const loadLayoutPreference = async () => {
      const storedLayout =
        (await AsyncStorage.getItem(LAYOUT_STORAGE_KEY)) as "grid" | "list";
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

  const handleTrackingToggleInList = async (
    bookId: string,
    isCurrentlyTracking: boolean,
    bookObject?: Book
  ) => {
    if (!bookObject) {
      console.warn("Book object is missing in handleTrackingToggleInList");
      Toast.show({ type: "error", text1: "Erreur de suivi", text2: "Données du livre manquantes." });
      return;
    }
    try {
      if (isCurrentlyTracking) {
        await untrackBook(bookId);
        Toast.show({ type: "info", text1: "Livre retiré de votre bibliothèque" });
      } else {
        await trackBook(bookId); // Assumes trackBook(bookId) is the correct usage
        Toast.show({ type: "info", text1: "Livre ajouté à votre bibliothèque" });
      }
    } catch (err) {
      const action = isCurrentlyTracking ? "retirer" : "d'ajouter";
      Toast.show({ type: "error", text1: "Erreur", text2: `Impossible de ${action} le livre.`});
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
        title={list?.name || "Liste"}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />

      {/* Loading and Error States */}
      {isLoading && !list && (
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {error && (
         <View style={styles.centeredLoader}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && list && ( // Render list only if not loading, no error, and list exists
        <AnimatedList
          ref={scrollRef}
          data={list.books || []} // Ensure list.books is not undefined
          key={currentLayout}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
          numColumns={currentLayout === "grid" ? 3 : 1}
          onScroll={scrollHandler}
          recycleItems
          ListHeaderComponent={
            <View>
              {list.backdrop_image && (
                <View style={{ position: "relative", width: "110%", height: 275, alignSelf: "center", marginHorizontal: -16, zIndex: -99 }}>
                  <Image
                    source={{ uri: list.backdrop_image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", colors.background]}
                    style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "50%" }}
                    pointerEvents="none"
                  />
                </View>
              )}
              <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
                <Text
                  style={[typography.h1, { color: colors.text, maxWidth: "80%" }]}
                  accessibilityRole="header"
                  accessibilityLabel={list.name}
                  numberOfLines={1}
                >
                  {list.name}
                </Text>
                <SwitchLayoutButton onPress={switchLayout} currentView={currentLayout} />
              </View>
              {list.description && (
                <View style={{ marginBottom: 32 }}>
                  <ExpandableDescription text={list.description} textStyle={{ color: colors.secondaryText }} />
                </View>
              )}
              {list.tags && (
                <View style={styles.badgeContainer}>
                  <BadgeSlider data={list.tags} />
                </View>
              )}
            </View>
          }
          renderItem={({ item }) =>
            currentLayout === "grid" ? (
              <View style={{ width: "33%" }}>
                <BookCard
                  book={item}
                  onPress={() => router.push(`/book/${item.id}`)}
                  size="compact"
                  showAuthor={false}
                  showTrackingStatus={true}
                  showTrackingButton={false}
                  showRating={false}
                  onTrackingToggle={handleTrackingToggleInList}
                />
              </View>
            ) : (
              <BookListElement
                book={item}
                onPress={() => router.push(`/book/${item.id}`)}
                showAuthor={false}
                showTrackingStatus={true}
                showTrackingButton={false}
                onTrackingToggle={handleTrackingToggleInList}
              />
            )
          }
          ItemSeparatorComponent={
            currentLayout === "grid"
              ? () => <View style={{ height: 26 }} />
              : () => <View style={{ height: 12 }} />
          }
          ListEmptyComponent={
            !list.books || list.books.length === 0 ? ( // Check if books array is undefined or empty
              <Text style={{ color: colors.secondaryText, textAlign: "center", marginTop: 32 }}>
                Aucun livre trouvé dans cette liste.
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
        <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle, { zIndex: 10 }]} pointerEvents="none">
          <BlurView intensity={40} tint={currentTheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
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
    marginTop: 32,
    marginBottom: 16,
  },
  badgeContainer: {
    marginBottom: 32,
  },
  centeredLoader: { // Added style for centering loader/error
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
