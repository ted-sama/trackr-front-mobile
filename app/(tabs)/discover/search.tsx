import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HeaderDiscover from '@/components/discover/HeaderDiscover';
import { useTheme } from '@/contexts/ThemeContext';
import { Book } from '@/types';
import BookListElement from '@/components/BookListElement';
import { search } from '@/api';
import { LegendList } from '@legendapp/list';

export default function SearchScreen() {
  const { colors, currentTheme } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const limit = 15;

  const handleSearch = (text: string) => {
    setError(null);
    setSearchText(text);
    setOffset(0);
    setHasMore(true);
    setSearchResults([]);
    fetchBooks(text, 0, false);
  }

  // Function to fetch paginated search results
  const fetchBooks = useCallback(async (text: string, newOffset = 0, append = false) => {
    if (!text) return;
    if (append) setIsFetchingMore(true); else setIsLoading(true);
    try {
      const results = await search({ query: text, offset: newOffset, limit });
      setOffset(newOffset + results.length);
      setSearchResults(prev => append ? [...prev, ...results] : results);
      setHasMore(results.length === limit);
    } catch (e: any) {
      setError(e.message || 'Erreur de recherche');
    } finally {
      if (append) setIsFetchingMore(false); else setIsLoading(false);
    }
  }, [limit]);

  // Handler for infinite scroll
  const handleEndReached = () => {
    if (isFetchingMore || isLoading || !hasMore) return;
    fetchBooks(searchText, offset, true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      <HeaderDiscover searchMode="search" onSearchTextChange={handleSearch} searchText={searchText} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <LegendList
          data={searchResults}
          renderItem={({ item }) => <BookListElement book={item} showAuthor showRating showTrackingButton onPress={() => router.push(`/book/${item.id}`)} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          recycleItems
          ListFooterComponent={isFetchingMore ? (
            <View style={styles.footerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});
