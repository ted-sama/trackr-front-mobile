import React, { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
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
import { useLocalSearchParams, useRouter } from "expo-router";
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
  Info,
} from "lucide-react-native";
import SortBottomSheet, { SortOption } from "@/components/SortBottomSheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import * as Haptics from "expo-haptics";
import SearchBar from "@/components/ui/SearchBar";
import { useUser, useUserBooks } from "@/hooks/queries/users";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Book>);

interface LibraryHeaderProps {
  insets: { top: number; bottom: number; left: number; right: number };
  onTitleLayout: (event: any) => void;
  booksCount: number;
  statusOptions: {
    key: ReadingStatus;
    label: string;
    icon: React.ReactNode;
  }[];
  selectedStatuses: ReadingStatus[];
  onToggleStatus: (status: ReadingStatus) => void;
  onOpenSort: () => void;
  onSwitchLayout: () => void;
  currentLayout: "grid" | "list";
  searchQuery: string;
  onSearchChange: (text: string) => void;
  colors: any;
  typography: any;
  t: any;
  username: string;
}

const LibraryHeader = React.memo(({
  insets,
  onTitleLayout,
  booksCount,
  statusOptions,
  selectedStatuses,
  onToggleStatus,
  onOpenSort,
  onSwitchLayout,
  currentLayout,
  searchQuery,
  onSearchChange,
  colors,
  typography,
  t,
  username,
}: LibraryHeaderProps) => {
  return (
    <View
      style={{
        marginTop: -insets.top,
        paddingTop: insets.top + 80,
      }}
    >
      {/* Search Bar */}
      <SearchBar
        placeholder={t("collection.myLibrary.searchPlaceholder")}
        value={searchQuery}
        onChangeText={onSearchChange}
        containerStyle={{ marginBottom: 16 }}
      />

      {/* Title and actions */}
      <View style={styles.header} onLayout={onTitleLayout}>
        <View style={styles.titleContainer}>
          <Text
            style={[typography.h1, { color: colors.text, maxWidth: "80%" }]}
            accessibilityRole="header"
            accessibilityLabel="Library"
            numberOfLines={1}
          >
            {t("profile.libraryScreen.title", { username })}
          </Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {booksCount} {t("common.book")}
            {booksCount > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onOpenSort} style={styles.actionButton}>
            <ArrowUpDown size={22} color={colors.icon} />
          </Pressable>
          <SwitchLayoutButton
            onPress={onSwitchLayout}
            currentView={currentLayout}
          />
        </View>
      </View>

      {/* Status filters */}
      <FlatList
        horizontal
        data={statusOptions}
        keyExtractor={(item) => item.key}
        renderItem={({ item: status }) => (
          <PillButton
            title={status.label}
            icon={status.icon}
            toggleable={true}
            selected={selectedStatuses.includes(status.key)}
            onPress={() => onToggleStatus(status.key)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={styles.statusFilters}
      />

      {/* Info note about displayed data */}
      <View style={styles.infoNote}>
        <Info size={14} color={colors.secondaryText} />
        <Text style={[typography.caption, { color: colors.secondaryText, flex: 1 }]}>
          {t("profile.libraryScreen.infoNote", { username })}
        </Text>
      </View>
    </View>
  );
});

LibraryHeader.displayName = "LibraryHeader";

export default function UserLibraryScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
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
  const sortSheetRef = useRef<TrueSheet>(null);
  const currentLayout = useUIStore((state) => state.myLibraryLayout);
  const setLayout = useUIStore((state) => state.setMyLibraryLayout);
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>({
    type: "title",
    order: "asc",
  });

  const { data: user } = useUser(userId);
  const { data: userBooks, isLoading, isError, error } = useUserBooks(user?.username);

  const handleBack = () => {
    router.back();
  };

  const books = React.useMemo(() => {
    if (!userBooks) return [];

    const filtered = userBooks
      .filter((book) => book && book.id)
      .filter(
        (book) =>
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(
            book.trackingStatus?.status as ReadingStatus
          )
      )
      .filter((book) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const titleMatch = book.title?.toLowerCase().includes(query);
        const authorMatch = book.authors?.some((author) =>
          author.name?.toLowerCase().includes(query)
        );
        return titleMatch || authorMatch;
      });

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
  }, [userBooks, selectedStatuses, sortOption, searchQuery]);

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

  // Calculate status counts efficiently in a single pass
  const statusCounts = React.useMemo(() => {
    const counts: Record<ReadingStatus, number> = {
      reading: 0,
      plan_to_read: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0,
    };

    books.forEach((book) => {
      const status = book.trackingStatus?.status;
      if (status && status in counts) {
        counts[status as ReadingStatus]++;
      }
    });

    return counts;
  }, [books]);

  const statusOptions: {
    key: ReadingStatus;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "reading",
      label: `${t("status.reading")} • ${statusCounts.reading}`,
      icon: <BookOpenIcon size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "plan_to_read",
      label: `${t("status.planToRead")} • ${statusCounts.plan_to_read}`,
      icon: <Clock3 size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "completed",
      label: `${t("status.completed")} • ${statusCounts.completed}`,
      icon: <BookCheck size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "on_hold",
      label: `${t("status.onHold")} • ${statusCounts.on_hold}`,
      icon: <Pause size={16} strokeWidth={1.75} color={colors.icon} />,
    },
    {
      key: "dropped",
      label: `${t("status.dropped")} • ${statusCounts.dropped}`,
      icon: <Square size={16} strokeWidth={1.75} color={colors.icon} />,
    },
  ];

  // Check if the error is a privacy error
  const isPrivateLibrary = isError && (error as any)?.response?.status === 403;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={t("profile.libraryScreen.title", { username: user?.displayName || "" })}
          scrollY={scrollY}
          collapseThreshold={titleY > 0 ? titleY : undefined}
          onBack={handleBack}
        />
        <View style={{ flex: 1, paddingTop: insets.top + 80, paddingHorizontal: 16 }}>
          <SkeletonLoader width="100%" height={40} style={{ marginBottom: 16, borderRadius: 8 }} />
          <SkeletonLoader width="60%" height={28} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="30%" height={16} style={{ marginBottom: 24 }} />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width={100} height={32} style={{ borderRadius: 16 }} />
            ))}
          </View>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width="100%" height={100} style={{ marginBottom: 12, borderRadius: 8 }} />
          ))}
        </View>
      </View>
    );
  }

  if (isPrivateLibrary) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <AnimatedHeader
          title={t("profile.libraryScreen.title", { username: user?.displayName || "" })}
          scrollY={scrollY}
          collapseThreshold={titleY > 0 ? titleY : undefined}
          onBack={handleBack}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <Text style={[typography.h2, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>
            {t("profile.libraryScreen.private")}
          </Text>
          <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>
            {t("profile.libraryScreen.privateDescription")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <AnimatedHeader
        title={t("profile.libraryScreen.title", { username: user?.displayName || "" })}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedFlatList
        data={books}
        keyExtractor={(item) => String(item.id)}
        key={currentLayout}
        numColumns={currentLayout === "grid" ? 3 : 1}
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 64,
          flexGrow: 1,
        }}
        columnWrapperStyle={currentLayout === "grid" ? { gap: 4 } : undefined}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <LibraryHeader
            insets={insets}
            onTitleLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
            booksCount={books.length}
            statusOptions={statusOptions}
            selectedStatuses={selectedStatuses}
            onToggleStatus={toggleStatus}
            onOpenSort={handleOpenSortSheet}
            onSwitchLayout={switchLayout}
            currentLayout={currentLayout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            colors={colors}
            typography={typography}
            t={t}
            username={user?.displayName || ""}
          />
        }
        stickyHeaderIndices={[]}
        ListHeaderComponentStyle={{ marginBottom: 0 }}
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
                showTrackingChapter={true}
                trackingStatusOverride={item.trackingStatus ? {
                  status: item.trackingStatus.status,
                  currentChapter: item.trackingStatus.currentChapter,
                  currentVolume: item.trackingStatus.currentVolume,
                  rating: item.trackingStatus.rating,
                } : null}
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
              showTrackingChapter={true}
              trackingStatusOverride={item.trackingStatus ? {
                status: item.trackingStatus.status,
                currentChapter: item.trackingStatus.currentChapter,
                currentVolume: item.trackingStatus.currentVolume,
                rating: item.trackingStatus.rating,
              } : null}
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
              {t("profile.libraryScreen.noBooks")}
            </Text>
          ) : null
        }
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
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  statusFilters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: 8,
  },
});
