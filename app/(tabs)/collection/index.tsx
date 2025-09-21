import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, Text, Pressable, FlatList } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import CollectionListElement from "@/components/CollectionListElement";
import { useRouter } from "expo-router";
import HeaderCollection from "@/components/collection/HeaderCollection";
import { LegendList } from "@legendapp/list";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { Book } from "@/types/book";
import { useTypography } from "@/hooks/useTypography";
import { useTheme } from "@/contexts/ThemeContext";
import { useMyLists } from '@/hooks/queries/lists';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

interface AnimatedCoverProps {
  book: Book;
  index: number;
  colors: any;
}

const AnimatedCover: React.FC<AnimatedCoverProps> = ({ book, index, colors }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-10);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 100, withTiming(0, { duration: 300 }));
  }, [opacity, translateY, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <AnimatedExpoImage
      key={book.id}
      source={book.coverImage ? { uri: book.coverImage } : { uri: "" }}
      style={[
        styles.coverImage,
        { left: index * 25, zIndex: index, borderColor: colors.border },
        animatedStyle,
      ]}
      contentFit="cover"
      transition={100}
    />
  );
};

interface MyLibraryHeaderProps {
  mosaicBooks: Book[];
  colors: any;
  typography: any;
  onPress: () => void;
  totalBooks: number;
}

const MyLibraryHeader: React.FC<MyLibraryHeaderProps> = React.memo(
  ({ mosaicBooks, colors, typography, onPress, totalBooks }) => {
    return (
      <Pressable onPress={onPress}>
        <View style={[styles.myLibraryHeaderMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stackContainer}>
            {mosaicBooks.map((book, index) => (
              <AnimatedCover key={book.id} book={book} index={index} colors={colors} />
            ))}
          </View>
          <Text style={[typography.h3, { marginTop: 16, color: colors.text }]}>Ma bibliothèque</Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>{totalBooks} livres</Text>
        </View>
      </Pressable>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.mosaicBooks.length === nextProps.mosaicBooks.length &&
      prevProps.mosaicBooks.every((book, index) => 
        book.id === nextProps.mosaicBooks[index].id && 
        book.coverImage === nextProps.mosaicBooks[index].coverImage
      ) &&
      prevProps.colors === nextProps.colors &&
      prevProps.typography === nextProps.typography &&
      prevProps.totalBooks === nextProps.totalBooks &&
      prevProps.onPress === nextProps.onPress
    );
  }
);
MyLibraryHeader.displayName = 'MyLibraryHeader';

export default function Collection() {
  const router = useRouter();
  const typography = useTypography();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState("");
  const { getTrackedBooks } = useTrackedBooksStore();
  const myLibrary = getTrackedBooks();
  const mosaicBooks = useMemo(() => myLibrary.slice(0, 10), [myLibrary]);
  const { data: myLists } = useMyLists();
  const lists = myLists || [];
  
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSubmitSearch = useCallback(() => {
    // TODO: brancher la recherche sur la liste
  }, []);

  const renderListHeader = useCallback(() => (
    <MyLibraryHeader
      mosaicBooks={mosaicBooks}
      colors={colors}
      typography={typography}
      onPress={() => router.push("/collection/my-library")}
      totalBooks={myLibrary.length}
    />
  ), [mosaicBooks, colors, typography, router, myLibrary.length]);

  return (
    <SafeAreaView edges={["right", "left", "bottom"]} style={{ flex: 1 }}>
      <HeaderCollection
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onSubmitSearch={handleSubmitSearch}
      />
      <View>
        <FlatList
          data={lists}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => <CollectionListElement list={item} onPress={() => {router.push({pathname: "/list-full", params: {id: item.id.toString()}})}} />}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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
    width: 235,
    height: 90,
    position: 'relative',
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    borderWidth: 0.75,
    position: 'absolute',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 128,
    paddingHorizontal: 16,
  },
});
