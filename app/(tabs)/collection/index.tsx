import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CollectionListElement from "@/components/CollectionListElement";
import { ReadingList } from "@/types";
import { useRouter } from "expo-router";
import HeaderCollection from "@/components/collection/HeaderCollection";

const myLibrary: ReadingList = {
  id: "1",
  user_id: "1",
  name: "Ma bibliothèque",
  description: "Ma bibliothèque personnelle",
  is_public: false,
  is_my_library: true,
  books: [],
  created_at: new Date(),
  updated_at: new Date(),
};

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
        <CollectionListElement list={myLibrary} onPress={() => {router.push("/collection/my-library")}} />
      </View>
    </SafeAreaView>
  );
}

