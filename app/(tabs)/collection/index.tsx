import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import CollectionListElement from "@/components/CollectionListElement";
import { ReadingList } from "@/types";
import { useRouter } from "expo-router";
import HeaderCollection from "@/components/collection/HeaderCollection";
import { LegendList } from "@legendapp/list";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useTypography } from "@/hooks/useTypography";
import { useTheme } from "@/contexts/ThemeContext";
import { useListStore } from '@/stores/listStore';

export default function Collection() {
  const router = useRouter();
  const typography = useTypography();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState("");
  const { getTrackedBooks } = useTrackedBooksStore();
  const myLibrary = getTrackedBooks();
  const mosaicBooks = myLibrary.slice(0, 8);
  const fetchMyLists = useListStore(state => state.fetchMyLists);
  const myListsIds = useListStore(state => state.myListsIds);
  const myListsById = useListStore(state => state.myListsById);
  const lists = myListsIds.map(id => myListsById[id]);
  
  useEffect(() => {
    fetchMyLists();
  }, [fetchMyLists]);
  
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSubmitSearch = useCallback(() => {
    // TODO: brancher la recherche sur la liste
  }, []);

  return (
    <SafeAreaView edges={["right", "left"]} style={{ flex: 1 }}>
      <HeaderCollection
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onSubmitSearch={handleSubmitSearch}
      />
      <View>
        <LegendList
          data={lists}
          ListHeaderComponent={() => (
            <Pressable onPress={() => {router.push("/collection/my-library")}}>
              <View style={[styles.myLibraryHeaderMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.stackContainer}>
                {mosaicBooks.map((book, index) => (
                  <Image
                    key={book.id}
                    source={book.cover_image ? { uri: book.cover_image } : { uri: "" }}
                    style={[styles.coverImage, { left: index * 25, zIndex: index, borderColor: colors.border }]}
                  />
                ))}
              </View>
              <Text style={[typography.h3, { marginTop: 16, color: colors.text }]}>Ma bibliothèque</Text>
              <Text style={[typography.caption, { color: colors.secondaryText }]}>{myLibrary.length} livres</Text>
            </View>
            </Pressable>
          )}
          renderItem={({ item }) => <CollectionListElement list={item} onPress={() => {router.push({pathname: "/list-full", params: {id: item.id}})}} />}
          keyExtractor={(item) => item.id.toString()}
          recycleItems
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
