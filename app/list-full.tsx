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
import { Book, ReadingList, BookTracking } from "@/types";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTrackedBooksStore } from "@/state/tracked-books-store";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { getMyLists, addBookToTracking, removeBookFromTracking, getList } from "@/api";
import Toast from "react-native-toast-message";
import ExpandableDescription from "@/components/ExpandableDescription";
import BadgeSlider from "@/components/BadgeSlider";

// AsyncStorage key for layout preference
const LAYOUT_STORAGE_KEY = "@MyApp:layoutPreference";
// Default layout preference
const DEFAULT_LAYOUT = "list";

const AnimatedList = Animated.createAnimatedComponent(LegendList<Book>);

export default function ListFull() {
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
  const [currentLayout, setCurrentLayout] =
    useState<"grid" | "list">(DEFAULT_LAYOUT as "grid" | "list");

  const {
    addTrackedBook: addTrackedBookToStore,
    removeTrackedBook: removeTrackedBookFromStore,
  } = useTrackedBooksStore();

  const [list, setList] = useState<ReadingList | null>(null);
  const [isBlurVisible, setIsBlurVisible] = useState(false);
  const blurOpacity = useSharedValue(0);

  // Animated opacity for blur
  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await getList(id as string);
        setList(response);
      } catch (err) {
        console.warn("Failed to fetch list:", err);
      }
    };
    fetchList();
  }, [id]);

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
    if (isCurrentlyTracking) {
      try {
        await removeBookFromTracking(bookId);
        removeTrackedBookFromStore(parseInt(bookId, 10));
        Toast.show({ type: "info", text1: "Livre retiré de votre bibliothèque" });
      } catch (err) {
        console.warn(`Failed to remove book ${bookId}:`, err);
        Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de retirer le livre." });
      }
    } else {
      try {
        const trackingStatus: BookTracking = await addBookToTracking(bookId);
        addTrackedBookToStore({ ...bookObject, tracking: true, tracking_status: trackingStatus });
        Toast.show({ type: "info", text1: "Livre ajouté à votre bibliothèque" });
      } catch (err) {
        console.warn(`Failed to add book ${bookId}:`, err);
        Toast.show({ type: "error", text1: "Erreur", text2: `Impossible d'ajouter le livre.` });
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
        title={list?.name || "Liste"}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      {list && (
        <AnimatedList
          ref={scrollRef}
          data={list.books || []}
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
            list.books?.length === 0 ? (
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
});
