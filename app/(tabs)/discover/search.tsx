import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
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
import { useSearch } from '@/hooks/queries/search';
import { Book } from '@/types/book';
import { List } from '@/types/list';

export default function SearchScreen() {
  const { colors } = useTheme();
  const typography = useTypography();
  const [searchQuery, setQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'books' | 'lists'>('books');
  const { data, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage, error } = useSearch(activeFilter, searchQuery);

  const debounceTimeoutRef = useRef<number | null>(null);

  const debouncedSearch = useCallback((text: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setQuery(text);
    }, 500);
  }, []);

  const handleSearchTextChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setQuery('');
    } else {
      debouncedSearch(text);
    }
  };

  const handleFilterChange = (filter: 'books' | 'lists') => {
    setActiveFilter(filter);
    
    // changing filter keeps current query; hook will refetch
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const flatResults = (data?.pages || []).flatMap(p => p.data);
  const hasResults = flatResults.length > 0;

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

    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      {isFetching && !hasResults && !error ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
          <LegendList
            data={flatResults}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {error ? String(error) : (searchQuery.trim() ? "Aucun résultat trouvé" : "Commencez votre recherche en tapant ci-dessus.")}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            ListFooterComponent={isFetchingNextPage ? (
              <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}
          />
        )}
      </TouchableWithoutFeedback>
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