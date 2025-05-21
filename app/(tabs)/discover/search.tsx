import React from 'react'; // Removed useState, useCallback
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HeaderDiscover from '@/components/discover/HeaderDiscover';
import { useTheme } from '@/contexts/ThemeContext';
import { Book } from '@/types';
import BookListElement from '@/components/BookListElement';
// import { search } from '@/api'; // Removed
import { LegendList } from '@legendapp/list';
import { useSearchStore } from '@/state/searchStore'; // Added

export default function SearchScreen() {
  const { colors, currentTheme } = useTheme();

  // Integrate useSearchStore
  const {
    results,
    query,
    isLoading,
    isFetchingMore,
    error,
    hasMore,
    setQuery,
    fetchMore,
    // clearSearch // Not used for now, but available
  } = useSearchStore();

  // handleSearch is replaced by setQuery directly
  // fetchBooks function is removed

  // Handler for infinite scroll
  const handleEndReached = () => {
    // fetchMore from the store already checks hasMore and loading states
    fetchMore();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      {/* Pass setQuery for onSearchTextChange and query for searchText */}
      <HeaderDiscover searchMode="search" onSearchTextChange={setQuery} searchText={query} />

      {/* Display error message if any */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {/* Use isLoading for the initial loading indicator */}
      {isLoading && !isFetchingMore && results.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <LegendList
          data={results} // Use results from store
          renderItem={({ item }) => <BookListElement book={item} showAuthor showRating showTrackingButton onPress={() => router.push(`/book/${item.id}`)} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            !isLoading && !error && query !== '' ? ( // Show "No results" only if not loading, no error, and query is not empty
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Aucun résultat trouvé pour "{query}"</Text>
              </View>
            ) : null 
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={handleEndReached} // Use updated handleEndReached
          onEndReachedThreshold={0.2} // Standard threshold
          recycleItems
          // Use isFetchingMore for the footer loading indicator
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
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
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
    textAlign: 'center',
  },
});
