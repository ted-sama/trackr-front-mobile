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
import { Book } from "@/types/book";
import { Category } from "@/types/category";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import ExpandableDescription from "@/components/ExpandableDescription";
import { useCategory } from "@/hooks/queries/categories";
import { useUIStore } from "@/stores/uiStore";

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
  const currentLayout = useUIStore((state) => state.categoryLayout);
  const setLayout = useUIStore((state) => state.setCategoryLayout);

  const {
    addTrackedBook: addTrackedBookToStore,
    removeTrackedBook: removeTrackedBookFromStore,
  } = useTrackedBooksStore();

  const { data: category } = useCategory(id as string);

  const handleBack = () => {
    router.back();
  };

  // Tracking toggle now handled inside BookCard/BookListElement

  const switchLayout = () => {
    const newLayout = currentLayout === "grid" ? "list" : "grid";
    setLayout(newLayout);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar />
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
