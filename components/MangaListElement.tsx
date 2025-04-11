import { Manga } from "@/types";
import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";

interface MangaListElementProps {
  manga: Manga;
  onPress: () => void;
}

const MangaListElement = ({ manga, onPress }: MangaListElementProps) => {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image source={{ uri: manga.coverImage }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{manga.title}</Text>
        <Text style={styles.author}>{manga.author}</Text>
      </View>
    </Pressable>
  );
};

export default MangaListElement;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  image: {
    width: 50,
    height: 75,
    borderRadius: 6,
  },
  infoContainer: {
    marginLeft: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  author: {
    fontSize: 14,
    color: "#666",
  },
});
