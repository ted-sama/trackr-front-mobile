import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HeaderDiscover from '@/components/discover/HeaderDiscover';
import { useTheme } from '@/contexts/ThemeContext';
import BookListElement from '@/components/BookListElement';
import CollectionListElement from '@/components/CollectionListElement';
import { LegendList } from '@legendapp/list';
import { useTypography } from '@/hooks/useTypography';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useSearchStore } from '@/stores/searchStore';
import { Book } from '@/types/book';
import { List } from '@/types/list';

export default function SearchScreen() {
  const { colors } = useTheme();
  const typography = useTypography();
  const { 
    searchQuery, 
    activeFilter,
    isLoading, 
    isLoadingMore, 
    error, 
    totalResults,
    setSearchQuery, 
    setActiveFilter,
    search, 
    loadMoreResults, 
    clearSearch,
    getCurrentResults
  } = useSearchStore();

  const debounceTimeoutRef = useRef<number | null>(null);

  const debouncedSearch = useCallback((text: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      search(text, 1);
    }, 500);
  }, [search]);

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      clearSearch();
    } else {
      debouncedSearch(text);
    }
  };

  const handleFilterChange = (filter: 'books' | 'lists') => {
    setActiveFilter(filter);
    
    // Si on a déjà une recherche, on la relance avec le nouveau filtre
    if (searchQuery.trim()) {
      search(searchQuery, 1);
    }
  };

  const handleEndReached = () => {
    console.log('handleEndReached called');
    loadMoreResults();
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const currentResults = getCurrentResults();
  const hasResults = currentResults.length > 0;

  const renderItem = ({ item }: { item: Book | List }) => {
    // Type guard pour distinguer Book de List
    if ('author' in item) {
      // C'est un Book
      return (
        <BookListElement 
          book={item as Book} 
          showAuthor 
          showRating 
          showTrackingButton 
          onPress={() => router.push(`/book/${item.id}`)} 
        />
      );
    } else {
      // C'est une List
      return (
        <CollectionListElement 
          list={item as List} 
          onPress={() => router.push(`/list-full?id=${item.id}`)}
          showDescription={true}
        />
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      <HeaderDiscover 
        searchMode="search" 
        onSearchTextChange={handleSearchTextChange} 
        searchText={searchQuery} 
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />
      
      {/* Statistiques de recherche */}
      {hasResults && (
        <View style={styles.statsContainer}>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
          </Text>
        </View>
      )}

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
            data={currentResults}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {error ? error : (searchQuery.trim() ? "Aucun résultat trouvé" : "Commencez votre recherche en tapant ci-dessus.")}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            ListFooterComponent={isLoadingMore ? (
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
  statsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  maskedView: {
    flex: 1,
  },
  maskGradient: {
    flex: 1,
  },
});