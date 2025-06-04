import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HeaderDiscover from '@/components/discover/HeaderDiscover';
import { useTheme } from '@/contexts/ThemeContext';
import { Book } from '@/types';
import BookListElement from '@/components/BookListElement';
import { search } from '@/services/api';
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
  const debounceTimeoutRef = useRef<number | null>(null);

  const fetchBooks = useCallback(async (text: string, newOffset = 0, append = false) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      setSearchResults([]);
      setIsLoading(false);
      setIsFetchingMore(false);
      setHasMore(true);
      setOffset(0);
      setError(null);
      return;
    }

    setError(null);
    if (append) {
      setIsFetchingMore(true);
    } else {
      setSearchResults([]);
      setOffset(0);
      setHasMore(true);
      setIsLoading(true);
    }

    try {
      const results = await search({ query: trimmedText, offset: newOffset, limit });
      
      if (append) {
        setSearchResults(prevSearchResults => {
          const existingIds = new Set(prevSearchResults.map(book => book.id));
          const uniqueNewBooks = results.filter(book => !existingIds.has(book.id));
          return [...prevSearchResults, ...uniqueNewBooks];
        });
      } else {
        setSearchResults(results);
      }
      
      setOffset(newOffset + results.length);
      setHasMore(results.length === limit);

    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue lors de la recherche.');
      setHasMore(false);
    } finally {
      if (append) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [limit]);

  const debouncedFetchBooks = useCallback((text: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchResults([]);
    setOffset(0);
    setHasMore(true);
    setIsLoading(true);
    setError(null);

    debounceTimeoutRef.current = setTimeout(() => {
      fetchBooks(text, 0, false);
    }, 500);
  }, [fetchBooks]);

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setError(null);
      setSearchResults([]);
      setIsLoading(false);
      setIsFetchingMore(false);
      setHasMore(true);
      setOffset(0);
    } else {
      debouncedFetchBooks(text);
    }
  };

  const loadMoreBooks = useCallback(() => {
    if (isFetchingMore || isLoading || !hasMore || !searchText.trim()) return;
    fetchBooks(searchText, offset, true);
  }, [isFetchingMore, isLoading, hasMore, searchText, offset, fetchBooks]);

  const handleEndReached = () => {
    loadMoreBooks();
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      <HeaderDiscover searchMode="search" onSearchTextChange={handleSearchTextChange} searchText={searchText} />

      {isLoading && searchResults.length === 0 && !error ? (
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
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {error ? error : (searchText.trim() ? "Aucun résultat trouvé" : "Commencez votre recherche en tapant ci-dessus.")}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
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
    padding: 20,
  },
  footerContainer: {
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
