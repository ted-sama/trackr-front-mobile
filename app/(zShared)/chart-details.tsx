import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useStatsFilteredBooks } from "@/hooks/queries/users";
import BookListElement from "@/components/BookListElement";
import BookCard from "@/components/BookCard";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import { useUIStore } from "@/stores/uiStore";
import { TrackedBookWithMeta } from "@/types/book";
import { useTranslateGenre } from "@/hooks/queries/genres";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<TrackedBookWithMeta>);

type ChartType = "genre" | "type" | "rating" | "series" | "author";

export default function ChartDetailsScreen() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const translateGenre = useTranslateGenre();

  const { chartType, filterValue, filterLabel, username } = useLocalSearchParams<{
    chartType: ChartType;
    filterValue: string;
    filterLabel?: string;
    username?: string;
  }>();

  const currentLayout = useUIStore((state) => state.listLayout);
  const setLayout = useUIStore((state) => state.setListLayout);

  // Fetch books from backend API
  const { data: filteredBooks = [], isLoading, isError } = useStatsFilteredBooks(
    chartType || "",
    filterValue || "",
    username
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const getTitle = () => {
    if (filterLabel) return filterLabel;

    switch (chartType) {
      case "genre":
        return translateGenre(filterValue || "");
      case "type":
        return t(`common.bookTypes.${filterValue}`);
      case "rating":
        return `${filterValue} ${t("stats.details.stars")}`;
      case "series":
        return t(`stats.series.${filterValue}`);
      case "author":
        return filterValue;
      default:
        return filterValue;
    }
  };

  const title = getTitle();

  const switchLayout = () => {
    setLayout(currentLayout === "grid" ? "list" : "grid");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={title || ""}
          scrollY={scrollY}
          onBack={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={title || ""}
          scrollY={scrollY}
          onBack={() => router.back()}
        />
        <View style={styles.emptyContainer}>
          <Text
            style={[
              typography.body,
              { color: colors.secondaryText, textAlign: "center" },
            ]}
          >
            {t("stats.error")}
          </Text>
        </View>
      </View>
    );
  }

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <View
        style={styles.titleRow}
        onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
      >
        <View style={styles.titleContainer}>
          <Text style={[typography.h1, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[typography.body, { color: colors.secondaryText, marginTop: 4 }]}>
            {t("stats.details.booksCount", { count: filteredBooks.length })}
          </Text>
        </View>
        <SwitchLayoutButton onPress={switchLayout} currentView={currentLayout} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={title || ""}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <AnimatedFlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id.toString()}
        key={currentLayout}
        numColumns={currentLayout === "grid" ? 3 : 1}
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 64,
          paddingTop: 70,
          flexGrow: 1,
        }}
        columnWrapperStyle={currentLayout === "grid" ? { gap: 4 } : undefined}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) =>
          currentLayout === "grid" ? (
            <View style={{ width: "33%" }}>
              <BookCard
                book={item}
                onPress={() => router.push(`/book/${item.id}`)}
                size="compact"
                showAuthor={true}
                showTrackingStatus={true}
                showTrackingButton={false}
                showRating={false}
              />
            </View>
          ) : (
            <BookListElement
              book={item}
              onPress={() => router.push(`/book/${item.id}`)}
              showAuthor={true}
              showTrackingStatus={true}
              showTrackingButton={false}
              showUserRating={chartType === "rating"}
            />
          )
        }
        ItemSeparatorComponent={
          currentLayout === "grid"
            ? () => <View style={{ height: 26 }} />
            : () => <View style={{ height: 12 }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[
                typography.body,
                { color: colors.secondaryText, textAlign: "center" },
              ]}
            >
              {t("stats.details.noBooks")}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 64,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
