import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HeaderDiscover from '@/components/discover/HeaderDiscover';
import { useTheme } from '@/contexts/ThemeContext';
import { Book, List, Chapter } from '@/types';
import BookListElement from '@/components/BookListElement';
import CollectionListElement from '@/components/CollectionListElement';
import { search } from '@/services/api';
import { LegendList } from '@legendapp/list';
import { useTypography } from '@/hooks/useTypography';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ books: Book[], lists: List[], chapters: Chapter[] }>({ books: [], lists: [], chapters: [] });
  const [searchText, setSearchText] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [activeFilters, setActiveFilters] = useState<('books' | 'chapters' | 'lists')[]>(['books']);
  const limit = 15;
  const debounceTimeoutRef = useRef<number | null>(null);
  const scaleAnimBooks = useRef(new Animated.Value(1)).current;
  const scaleAnimLists = useRef(new Animated.Value(1)).current;

  const fetchResults = useCallback(async (text: string, newOffset = 0, append = false) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      setSearchResults({ books: [], lists: [], chapters: [] });
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
      setSearchResults({ books: [], lists: [], chapters: [] });
      setOffset(0);
      setHasMore(true);
      setIsLoading(true);
    }

    try {
      const results = await search({ query: trimmedText, offset: newOffset, limit, types: activeFilters });
      
      if (append) {
        setSearchResults(prevSearchResults => {
          const existingBookIds = new Set(prevSearchResults.books.map(book => book.id));
          const existingListIds = new Set(prevSearchResults.lists.map(list => list.id));
          const existingChapterIds = new Set(prevSearchResults.chapters.map(chapter => chapter.id));
          
          const uniqueNewBooks = results.books.filter(book => !existingBookIds.has(book.id));
          const uniqueNewLists = results.lists.filter(list => !existingListIds.has(list.id));
          const uniqueNewChapters = results.chapters.filter(chapter => !existingChapterIds.has(chapter.id));
          
          return {
            books: [...prevSearchResults.books, ...uniqueNewBooks],
            lists: [...prevSearchResults.lists, ...uniqueNewLists],
            chapters: [...prevSearchResults.chapters, ...uniqueNewChapters]
          };
        });
      } else {
        setSearchResults(results);
      }
      
      const totalResults = results.books.length + results.lists.length + results.chapters.length;
      setOffset(newOffset + totalResults);
      setHasMore(totalResults === limit);

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
  }, [limit, activeFilters]);

  const debouncedFetchResults = useCallback((text: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchResults({ books: [], lists: [], chapters: [] });
    setOffset(0);
    setHasMore(true);
    setIsLoading(true);
    setError(null);

    debounceTimeoutRef.current = setTimeout(() => {
      fetchResults(text, 0, false);
    }, 500);
  }, [fetchResults]);

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setError(null);
      setSearchResults({ books: [], lists: [], chapters: [] });
      setIsLoading(false);
      setIsFetchingMore(false);
      setHasMore(true);
      setOffset(0);
    } else {
      debouncedFetchResults(text);
    }
  };

  const loadMoreResults = useCallback(() => {
    if (isFetchingMore || isLoading || !hasMore || !searchText.trim()) return;
    fetchResults(searchText, offset, true);
  }, [isFetchingMore, isLoading, hasMore, searchText, offset, fetchResults]);

  const handleEndReached = () => {
    loadMoreResults();
  };

  const toggleFilter = (filter: 'books' | 'chapters' | 'lists') => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter];
      
      // Au moins un filtre doit être actif
      return newFilters.length > 0 ? newFilters : prev;
    });
  };

  const getAllResults = () => {
    const allResults: Array<{ type: 'book' | 'list' | 'chapter', data: Book | List | Chapter }> = [];
    
    if (activeFilters.includes('books')) {
      searchResults.books.forEach(book => allResults.push({ type: 'book', data: book }));
    }
    if (activeFilters.includes('lists')) {
      searchResults.lists.forEach(list => allResults.push({ type: 'list', data: list }));
    }
    if (activeFilters.includes('chapters')) {
      searchResults.chapters.forEach(chapter => allResults.push({ type: 'chapter', data: chapter }));
    }
    
    return allResults;
  };

  useEffect(() => {
    // Relancer la recherche quand les filtres changent
    if (searchText.trim()) {
      debouncedFetchResults(searchText);
    }
  }, [activeFilters]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const allResults = getAllResults();
  const hasResults = allResults.length > 0;

  const handlePressInBooks = () => {
    Animated.spring(scaleAnimBooks, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutBooks = () => {
    Animated.spring(scaleAnimBooks, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressInLists = () => {
    Animated.spring(scaleAnimLists, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutLists = () => {
    Animated.spring(scaleAnimLists, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      <HeaderDiscover searchMode="search" onSearchTextChange={handleSearchTextChange} searchText={searchText} />
      
      {/* Filtres */}
      <View style={styles.filtersContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnimBooks }] }}>
            <Pressable
              style={[
                styles.filterButton,
                { backgroundColor: activeFilters.includes('books') ? colors.primary : colors.card },
                { borderColor: activeFilters.includes('books') ? colors.primary : colors.border }
              ]}
              onPress={() => toggleFilter('books')}
              onPressIn={handlePressInBooks}
              onPressOut={handlePressOutBooks}
            >
              <Text style={[
                styles.filterText,
                typography.caption,
                { color: activeFilters.includes('books') ? "white" : colors.text }
              ]}>
                Livres
              </Text>
            </Pressable>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnimLists }] }}>
            <Pressable
              style={[
                styles.filterButton,
                { backgroundColor: activeFilters.includes('lists') ? colors.primary : colors.card },
                { borderColor: activeFilters.includes('lists') ? colors.primary : colors.border }
              ]}
              onPress={() => toggleFilter('lists')}
              onPressIn={handlePressInLists}
              onPressOut={handlePressOutLists}
            >
              <Text style={[
                styles.filterText,
                typography.caption,
                { color: activeFilters.includes('lists') ? "white" : colors.text }
              ]}>
                Listes
              </Text>
            </Pressable>
          </Animated.View>
      </View>

      {isLoading && !hasResults && !error ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <MaskedView
          style={styles.maskedView}
          maskElement={
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,1)']}
              locations={[0, 0.02, 0.08]}
              style={styles.maskGradient}
            />
          }
        >
          <LegendList
            data={allResults}
            renderItem={({ item }) => {
              if (item.type === 'book') {
                return (
                  <BookListElement 
                    book={item.data as Book} 
                    showAuthor 
                    showRating 
                    showTrackingButton 
                    onPress={() => router.push(`/book/${item.data.id}`)} 
                  />
                );
              } else if (item.type === 'list') {
                return (
                  <CollectionListElement 
                    list={item.data as List} 
                    onPress={() => router.push(`/list-full?id=${item.data.id}`)} 
                    showDescription={true}
                  />
                );
              } else {
                // Pour les chapitres, on peut créer un composant simple ou les ignorer pour l'instant
                return (
                  <View style={styles.chapterItem}>
                    <Text style={[typography.body, { color: colors.text }]} numberOfLines={2}>
                      {(item.data as Chapter).title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.secondaryText }]}>
                      Chapitre {(item.data as Chapter).chapter}
                    </Text>
                  </View>
                );
              }
            }}
            keyExtractor={(item) => `${item.type}-${item.data.id}`}
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
        </MaskedView>
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
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filtersScrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterText: {
    fontWeight: '500',
  },
  chapterItem: {
    padding: 16,
    borderRadius: 8,
  },
  maskedView: {
    flex: 1,
  },
  maskGradient: {
    flex: 1,
  },
});
