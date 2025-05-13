import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CollectionListElement from "@/components/CollectionListElement";
import { ReadingList } from "@/types";
import { useRouter } from "expo-router";
import HeaderCollection from "@/components/collection/HeaderCollection";
import { LegendList } from "@legendapp/list";

const lists: ReadingList[] = [
  {
    id: "1",
    user_id: "1",
    name: "Ma bibliothèque",
    description: "Ma bibliothèque personnelle",
    is_public: false,
    is_my_library: true,
    books: [],
    created_at: new Date(),
    updated_at: new Date(),
  }
]

export default function Collection() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

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
          renderItem={({ item }) => <CollectionListElement list={item} onPress={() => {router.push("/collection/my-library")}} />}
          keyExtractor={(item) => item.id.toString()}
          recycleItems
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
