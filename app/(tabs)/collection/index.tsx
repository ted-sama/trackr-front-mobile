import React, { useState, useCallback } from "react";
import { View, StyleSheet, Image, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CollectionListElement from "@/components/CollectionListElement";
import { useRouter } from "expo-router";
import HeaderCollection from "@/components/collection/HeaderCollection";
import { LegendList } from "@legendapp/list";
import { useTrackingStore } from "../../store/trackingStore"; // Adjusted path
import { useListStore } from "../../store/listStore"; // Adjusted path
import { useTypography } from "@/hooks/useTypography";
import { useTheme } from "@/contexts/ThemeContext";
import { useFocusEffect } from '@react-navigation/native';

export default function Collection() {
  const router = useRouter();
  const typography = useTypography();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState("");

  const { 
    getTrackedBooks, 
    fetchTrackedBooks, 
    trackedBooks: trackedBooksMap, 
    isLoading: isLoadingTrackedBooks 
  } = useTrackingStore();
  
  const { 
    lists, 
    isLoading: isLoadingLists, 
    error: errorLists, 
    fetchUserLists 
  } = useListStore();

  useFocusEffect(
    useCallback(() => {
      fetchUserLists();
      // Fetch tracked books if not already loaded or to refresh
      // Consider checking if trackedBooksMap is empty or needs refresh
      if (Object.keys(trackedBooksMap).length === 0) {
        fetchTrackedBooks();
      }
    }, [fetchUserLists, fetchTrackedBooks, trackedBooksMap])
  );
  
  const myLibrary = getTrackedBooks(); // This selector gets the array from the map
  const mosaicBooks = myLibrary.slice(0, 8);
  
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSubmitSearch = useCallback(() => {
    // TODO: brancher la recherche sur la liste (filter `lists` based on `searchText`)
    console.log("Search submitted:", searchText);
  }, [searchText]);

  const renderListHeader = () => (
    <Pressable onPress={() => {router.push("/collection/my-library")}}>
      <View style={[styles.myLibraryHeaderMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stackContainer}>
          {isLoadingTrackedBooks && mosaicBooks.length === 0 ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            mosaicBooks.map((book, index) => (
              <Image
                key={book.id}
                source={book.cover_image ? { uri: book.cover_image } : { uri: "" }} // Handle missing cover_image
                style={[styles.coverImage, { left: index * 25, zIndex: index, borderColor: colors.border }]}
              />
            ))
          )}
        </View>
        <Text style={[typography.h3, { marginTop: 16, color: colors.text }]}>Ma bibliothèque</Text>
        <Text style={[typography.caption, { color: colors.secondaryText }]}>{myLibrary.length} livres</Text>
      </View>
    </Pressable>
  );

  if (isLoadingLists && lists.length === 0) { // Show loading indicator only if lists are empty
    return (
      <SafeAreaView edges={["right", "left"]} style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (errorLists) {
    return (
      <SafeAreaView edges={["right", "left"]} style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Erreur: {errorLists}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["right", "left"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderCollection
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onSubmitSearch={handleSubmitSearch}
      />
      {/* Wrap LegendList in a View to ensure it doesn't try to flex: 1 directly within SafeAreaView if not intended */}
      <View style={{flex: 1}}> 
        <LegendList
          data={lists} // TODO: Filter lists based on searchText if search is implemented
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => <CollectionListElement list={item} onPress={() => {router.push({pathname: "/list-full", params: {id: item.id}})}} />}
          keyExtractor={(item) => item.id.toString()}
          recycleItems
          contentContainerStyle={styles.listContainer}
          // Add a message for when no lists are found
          ListEmptyComponent={
            !isLoadingLists && lists.length === 0 ? (
              <View style={styles.centeredMessage}>
                <Text style={{color: colors.text, ...typography.body}}>Vous n'avez pas encore de listes.</Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  myLibraryHeaderMenu: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stackContainer: {
    width: 185,
    height: 90,
    position: 'relative',
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    borderWidth: 0.75,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }
});
