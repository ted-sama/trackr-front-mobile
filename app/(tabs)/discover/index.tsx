import React, { useState, useCallback, useRef, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator, Pressable } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { DiscoverAnimatedHeader } from "@/components/discover/DiscoverAnimatedHeader";
import { SearchResults } from "@/components/discover/SearchResults";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useCategories } from "@/hooks/queries/categories";
import { useLists } from "@/hooks/queries/lists";
import CategorySlider from "@/components/CategorySlider";
import CollectionListElement from "@/components/CollectionListElement";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react-native";

type FilterType = 'books' | 'lists' | 'users';

const MAX_LISTS_PREVIEW = 3;

// Component for Book Categories Section
function BookCategoriesSection() {
  const { colors } = useTheme();
  const { isBottomSheetVisible } = useBottomSheet();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { data: categories, isLoading, error } = useCategories();

  useEffect(() => {
    if (categories) setHasLoadedOnce(true);
  }, [categories]);

  if (isLoading && !hasLoadedOnce) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !hasLoadedOnce) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Erreur de chargement</Text>
      </View>
    );
  }

  return (
    <View>
      {(categories || []).map((category) => (
        <CategorySlider
          key={category.id}
          category={category}
          isBottomSheetVisible={isBottomSheetVisible}
          seeMore={false}
        />
      ))}
    </View>
  );
}

// Component for User Lists Section
function UserListsSection() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const typography = useTypography();
  const router = useRouter();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { data: listsData, isLoading, error } = useLists();
  const allLists = (listsData || []).filter(list => list.isPublic);
  const lists = allLists.slice(0, MAX_LISTS_PREVIEW);
  const hasMoreLists = allLists.length > MAX_LISTS_PREVIEW;

  useEffect(() => {
    if (listsData) setHasLoadedOnce(true);
  }, [listsData]);

  if (error && !hasLoadedOnce) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>
          Erreur de chargement
        </Text>
        <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listsContent}>
      {lists.map((item, index) => (
        <View key={item.id.toString()}>
          {index > 0 && <View style={{ height: 16 }} />}
          <CollectionListElement
            list={item}
            showDescription
            onPress={() => {
              router.push(`/list/${item.id}`);
            }}
          />
        </View>
      ))}

      {/* {hasMoreLists && (
        <Pressable
          onPress={() => router.push('/(tabs)/discover/all-lists')}
          style={[styles.seeMoreButton, { borderColor: colors.border }]}
        >
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
            + de listes
          </Text>
          <ChevronRight size={20} color={colors.primary} />
        </Pressable>
      )} */}

      {(!isLoading || hasLoadedOnce) && lists.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>
            {t('discover.lists.empty')}
          </Text>
          <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
            {t('discover.lists.emptyDescription')}
          </Text>
        </View>
      )}
      {isLoading && !hasLoadedOnce && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const isSearching = debouncedSearchQuery.trim().length > 0;

  const renderContent = () => {
    if (isSearching) {
      return <SearchResults searchQuery={debouncedSearchQuery} activeFilter={selectedFilter} />;
    }

    // Show both books and lists together
    return (
      <View>
        {/* Books Section */}
        <View style={styles.section}>
          <BookCategoriesSection />
        </View>

        {/* Lists Section */}
        <View style={styles.section}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => router.push('/(tabs)/discover/all-lists')}
          >
            <Text style={[typography.categoryTitle, { color: colors.text }]}>
              {t('discover.lists.header')}
            </Text>
            <ChevronRight size={20} strokeWidth={2.5} color={colors.secondaryText} />
          </Pressable>
          <UserListsSection />
        </View>
      </View>
    );
  };

  return (
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
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listsContent: {
    paddingBottom: 128,
    paddingHorizontal: 16,
  },
  errorContainer: {
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  emptyContainer: {
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
});
