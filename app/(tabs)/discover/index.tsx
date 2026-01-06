import React, { useState, useCallback, useRef, useMemo } from "react";
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue, runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { DiscoverAnimatedHeader } from "@/components/discover/DiscoverAnimatedHeader";
import { SearchResults } from "@/components/discover/SearchResults";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { usePopularBooks } from "@/hooks/queries/books";
import BookCard from "@/components/BookCard";
import { useTranslation } from "react-i18next";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Book } from "@/types/book";

type FilterType = 'books' | 'lists' | 'users';

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_PADDING = 16;
const GRID_GAP = 12;
const ITEM_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function Discover() {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const typography = useTypography();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('books');
  const scrollY = useSharedValue(0);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounced search to avoid too many queries
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Popular books query
  const {
    data: popularBooksData,
    isLoading: isLoadingPopular,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePopularBooks();

  // Flatten paginated data
  const popularBooks = useMemo(() => {
    if (!popularBooksData?.pages) return [];
    return popularBooksData.pages.flatMap((page) => page.data);
  }, [popularBooksData]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!text.trim()) {
      setDebouncedSearchQuery('');
    } else {
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedSearchQuery(text);
      }, 500);
    }
  }, []);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setSelectedFilter(filter);
  }, []);

  const isSearching = debouncedSearchQuery.trim().length > 0;

  const checkEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isSearching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isSearching, fetchNextPage]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      // Check if near bottom for infinite scroll
      const { layoutMeasurement, contentOffset, contentSize } = event;
      const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;

      if (isNearBottom) {
        runOnJS(checkEndReached)();
      }
    },
  });

  const handleBookPress = useCallback((book: Book) => {
    router.push({ pathname: "/book/[id]", params: { id: book.id.toString() } });
  }, [router]);

  // Create rows of books for grid layout
  const bookRows = useMemo(() => {
    const rows: Book[][] = [];
    for (let i = 0; i < popularBooks.length; i += NUM_COLUMNS) {
      rows.push(popularBooks.slice(i, i + NUM_COLUMNS));
    }
    return rows;
  }, [popularBooks]);

  const renderPopularContent = () => {
    if (isLoadingPopular && popularBooks.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (popularBooks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center' }]}>
            {t('discover.popular.empty')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContent}>
        {bookRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((book) => (
              <View key={book.id} style={styles.gridItem}>
                <BookCard
                  book={book}
                  onPress={handleBookPress}
                  size="compact"
                  showTitle={false}
                  showAuthor={false}
                  showRating={false}
                  showTrackingButton={false}
                />
              </View>
            ))}
          </View>
        ))}
        {isFetchingNextPage && (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isSearching) {
      return <SearchResults searchQuery={debouncedSearchQuery} activeFilter={selectedFilter} />;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.categoryTitle, { color: colors.text }]}>
            {t('discover.popular.title')}
          </Text>
        </View>
        {renderPopularContent()}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["right", "left"]}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <DiscoverAnimatedHeader
          scrollY={scrollY}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
        />
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
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
    paddingTop: 140, // Space for the header
    paddingBottom: 100, // Space for tab bar
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: GRID_PADDING,
    marginBottom: 16,
  },
  centered: {
    paddingVertical: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
