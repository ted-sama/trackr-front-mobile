import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Platform,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import BookListElement from "@/components/BookListElement";
import BookCard from "@/components/BookCard";
import { Book } from "@/types/book";
import { useRouter } from "expo-router";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import SwitchLayoutButton from "@/components/SwitchLayoutButton";
import { useUIStore } from "@/stores/uiStore";
import { useTranslation } from "react-i18next";
import PillButton from "@/components/ui/PillButton";
import { ReadingStatus } from "@/types/reading-status";
import {
  BookCheck,
  BookOpenIcon,
  Clock3,
  Pause,
  Square,
  ArrowUpDown,
} from "lucide-react-native";
import SortBottomSheet, { SortOption } from "@/components/SortBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";

const AnimatedList = Animated.createAnimatedComponent(FlatList<Book>);

export default function MyLibrary() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<FlatList<Book> | null>(null);
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const currentLayout = useUIStore((state) => state.myLibraryLayout);
  const setLayout = useUIStore((state) => state.setMyLibraryLayout);
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>({
    type: "date",
    order: "desc",
  });

  const handleBack = () => {
    router.back();
  };

  // Subscribe to trackedBooks state directly so the component re-renders when it changes
  const trackedBooks = useTrackedBooksStore((state) => state.trackedBooks);
  const addTrackedBook = useTrackedBooksStore((state) => state.addTrackedBook);
  const removeTrackedBookFromStore = useTrackedBooksStore(
    (state) => state.removeTrackedBook
  );

  const books = React.useMemo(() => {
    const booksArray = Object.values(trackedBooks);
    const filtered = booksArray
      .filter((book) => book && book.id)
      .filter(
        (book) =>
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(
            book.trackingStatus?.status as ReadingStatus
          )
      );

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortOption.type) {
        case "rating":
          const ratingA = a.trackingStatus?.rating ?? 0;
          const ratingB = b.trackingStatus?.rating ?? 0;
          comparison = ratingA - ratingB;
          break;
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "", undefined, {
            sensitivity: "base",
          });
          break;
        case "author":
          const authorA = a.authors?.[0]?.name || "";
          const authorB = b.authors?.[0]?.name || "";
          comparison = authorA.localeCompare(authorB, undefined, {
            sensitivity: "base",
          });
          break;
        case "date":
          const dateA = a.trackingStatus?.createdAt
            ? new Date(a.trackingStatus.createdAt).getTime()
            : 0;
          const dateB = b.trackingStatus?.createdAt
            ? new Date(b.trackingStatus.createdAt).getTime()
            : 0;
          comparison = dateA - dateB;
          break;
      }

      return sortOption.order === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [trackedBooks, selectedStatuses, sortOption]);

  const switchLayout = () => {
    const newLayout = currentLayout === "grid" ? "list" : "grid";
    setLayout(newLayout);
  };

  const toggleStatus = (status: ReadingStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleOpenSortSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sortSheetRef.current?.present();
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
  };

  const statusOptions: {
    key: ReadingStatus;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "reading",
      label: `${t("status.reading")} • ${books.filter((book) => book.trackingStatus?.status === "reading").length}`,
      icon: <BookOpenIcon size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "plan_to_read",
      label: `${t("status.planToRead")} • ${books.filter((book) => book.trackingStatus?.status === "plan_to_read").length}`,
      icon: <Clock3 size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "completed",
      label: `${t("status.completed")} • ${books.filter((book) => book.trackingStatus?.status === "completed").length}`,
      icon: <BookCheck size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "on_hold",
      label: `${t("status.onHold")} • ${books.filter((book) => book.trackingStatus?.status === "on_hold").length}`,
      icon: <Pause size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "dropped",
      label: `${t("status.dropped")} • ${books.filter((book) => book.trackingStatus?.status === "dropped").length}`,
      icon: <Square size={16} strokeWidth={1.75} color={colors.icon} />,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={t("collection.myLibrary.title")}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedList
        ref={scrollRef}
        data={books}
        key={currentLayout}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 64,
          flexGrow: 1,
        }}
        numColumns={currentLayout === "grid" ? 3 : 1}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View>
            <View
              style={styles.header}
              onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <Text
                  style={[
                    typography.h1,
                    { color: colors.text, maxWidth: "80%" },
                  ]}
                  accessibilityRole="header"
                  accessibilityLabel="Library"
                  numberOfLines={1}
                >
                  {t("collection.myLibrary.title")}
                </Text>
                <Text
                  style={[typography.body, { color: colors.secondaryText }]}
                >
                  {books.length} {t("common.book")}
                  {books.length > 1 ? "s" : ""}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Pressable
                  onPress={handleOpenSortSheet}
                  style={{
                    width: 32,
                    height: 32,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ArrowUpDown size={22} color={colors.icon} />
                </Pressable>
                <SwitchLayoutButton
                  onPress={switchLayout}
                  currentView={currentLayout}
                />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={styles.statusFilters}
            >
              {statusOptions.map((status) => (
                <PillButton
                  key={status.key}
                  title={status.label}
                  icon={status.icon}
                  toggleable={true}
                  selected={selectedStatuses.includes(status.key)}
                  onPress={() => toggleStatus(status.key)}
                />
              ))}
            </ScrollView>
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
                showAuthor={false}
                showUserRating={sortOption.type === "rating"}
                showTrackingStatus={true}
                showTrackingButton={false}
                showRating={false}
              />
            </View>
          ) : (
            <BookListElement
              book={item}
              onPress={() => {
                router.push(`/book/${item.id}`);
              }}
              showAuthor={false}
              showUserRating={sortOption.type === "rating"}
              showTrackingStatus={true}
              showTrackingButton={false}
              showRating={false}
            />
          )
        }
        ItemSeparatorComponent={
          currentLayout === "grid"
            ? () => <View style={{ height: 26 }} />
            : () => <View style={{ height: 12 }} />
        }
        ListEmptyComponent={
          books.length === 0 ? (
            <Text
              style={[
                typography.body,
                {
                  color: colors.secondaryText,
                  textAlign: "center",
                  marginTop: 32,
                },
              ]}
            >
              {t("collection.myLibrary.noBooks")}
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
      <SortBottomSheet
        ref={sortSheetRef}
        onSortChange={handleSortChange}
        currentSort={sortOption}
      />
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
  statusFilters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
});
