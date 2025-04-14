import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import HeaderDiscover from '@/components/discover/HeaderDiscover';
import { useTheme } from '@/contexts/ThemeContext';
import { Book } from '@/types';
import BookListElement from '@/components/BookListElement';

export default function SearchScreen() {
  const { colors, currentTheme } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const handleSearch = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setSearchText(text);
    setSearchResults([]);

    try {
      const response = await fetch(`https://2d23-81-198-118-168.ngrok-free.app/api/search?q=${text}&type=books&limit=10&offset=0`);
      const data: Book[] = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    } 
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["right", "left"]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <HeaderDiscover searchMode="search" onSearchTextChange={handleSearch} searchText={searchText} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => <BookListElement book={item} onPress={() => {}} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
            </View>
          }
          initialNumToRender={5}
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
    paddingHorizontal: 4,
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
