import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, Text, Pressable, FlatList } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import CollectionListElement from "@/components/CollectionListElement";
import { useRouter } from "expo-router";
import CollectionHeader from "@/components/collection/HeaderCollection";
import CreateListBottomSheet from "@/components/CreateListBottomSheet";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { Book } from "@/types/book";
import { useTypography } from "@/hooks/useTypography";
import { useTheme } from "@/contexts/ThemeContext";
import { useMyLists } from '@/hooks/queries/lists';
import { useStableTrimmedQuery } from '@/hooks/useDebouncedValue';
import { ScreenWrapper } from "@/components/ScreenWrapper";

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

interface AnimatedCoverProps {
  book: Book;
  index: number;
  colors: any;
}

const AnimatedCover: React.FC<AnimatedCoverProps> = ({ book, index, colors }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.8);

  // Créer un effet de stack "sens dessus dessous" - rotations alternées
  const rotations = [5, 12, 8, -7, -10]; // Rotations variées pour effet désordonné
  const horizontalOffsets = [0, 15, -10, 20, -15]; // Décalages horizontaux variés
  const verticalOffsets = [0, -5, -10, -15, -20]; // Décalage vertical empilé

  const rotation = rotations[index] || 0;
  const horizontalOffset = horizontalOffsets[index] || 0;
  const verticalOffset = verticalOffsets[index] || 0;

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 80, withTiming(0, { duration: 400 }));
    scale.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
  }, [opacity, translateY, scale, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation}deg` }, // Rotation incluse dans l'animation
      ],
    };
  });

  const coverWidth = 85; // Augmenté de 70 à 85
  const coverHeight = 128; // Augmenté de 105 à 128

  return (
    <AnimatedExpoImage
      key={book.id}
      source={book.coverImage ? { uri: book.coverImage } : { uri: "" }}
      style={[
        {
          width: coverWidth,
          height: coverHeight,
          borderRadius: 6,
          borderWidth: 0.5, // Bordure plus fine
          position: 'absolute' as const,
          backgroundColor: '#fff',
          left: '50%',
          marginLeft: -(coverWidth / 2) + horizontalOffset, // Centrer et ajouter offset
          top: 50 + verticalOffset,
          zIndex: 5 - index,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 8 + index * 3, // Ombre plus prononcée
          },
          shadowOpacity: 0.5 - index * 0.06, // Opacité augmentée
          shadowRadius: 15 + index * 3, // Rayon plus large
        },
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
    const { t } = useTranslation();
    const scaleAnim = useSharedValue(1);

    const animatedPressableStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleAnim.value }],
    }));

    const handlePressIn = () => {
      scaleAnim.value = withTiming(0.97, { duration: 100 });
    };

    const handlePressOut = () => {
      scaleAnim.value = withTiming(1, { duration: 100 });
    };

    // Limiter à 5 couvertures maximum
    const displayBooks = mosaicBooks.slice(0, 5);

    return (
      <Animated.View style={[{ marginBottom: 24, alignItems: 'center' }, animatedPressableStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.myLibraryHeaderMenu}
        >
          {displayBooks.length > 0 ? (
            <View style={styles.stackContainer}>
              {displayBooks.map((book, index) => (
                <AnimatedCover key={book.id} book={book} index={index} colors={colors} />
              ))}
            </View>
          ) : (
            <View style={[styles.stackContainer, { justifyContent: 'center' }]}>
              <Text style={[typography.caption, { color: colors.secondaryText, textAlign: 'center' }]}>
                {t("collection.myLibrary.startReading")}
              </Text>
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]} numberOfLines={1}>
              {t("collection.myLibrary.title")}
            </Text>
            <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 2, textAlign: 'center' }]}>
              {totalBooks} {t("collection.books")}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
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
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const debouncedQuery = useStableTrimmedQuery(searchText);
  const { t } = useTranslation();
  // Subscribe to trackedBooks state directly so the component re-renders when it changes
  const trackedBooks = useTrackedBooksStore((state) => state.trackedBooks);
  const isLoading = useTrackedBooksStore((state) => state.isLoading);
  const error = useTrackedBooksStore((state) => state.error);
  
  const myLibrary = useMemo(() => {
    const books = Object.values(trackedBooks);
    return books.filter(book => book && book.id);
  }, [trackedBooks]);
  
  const mosaicBooks = useMemo(() => myLibrary.slice(0, 10), [myLibrary]);
  const { data: myLists } = useMyLists(debouncedQuery);
  const lists = (myLists?.pages.flatMap((p: any) => p.data) ?? []) as any[];
  const createListBottomSheetRef = useRef<TrueSheet>(null);
  
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleAddList = useCallback(() => {
    createListBottomSheetRef.current?.present();
  }, []);

  const renderListHeader = useCallback(() => (
    <>
    <MyLibraryHeader
      mosaicBooks={mosaicBooks}
      colors={colors}
      typography={typography}
      onPress={() => router.push("/collection/my-library")}
      totalBooks={myLibrary.length}
    />
    <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 32 }} />
    <Text style={[typography.caption, { color: colors.secondaryText, marginBottom: 16 }]}>
      {lists.length} {lists.length > 1 ? t("common.lists") : t("common.list")}
    </Text>
    </>
  ), [mosaicBooks, colors, typography, router, myLibrary.length]);

  return (
    <ScreenWrapper>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["right", "left"]}>
      <CollectionHeader
        searchText={searchText}
        onSearchTextChange={handleSearchTextChange}
        onAddPress={handleAddList}
      />
      <FlatList
        data={lists}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => <CollectionListElement list={item} onPress={() => {router.push(`/list/${item.id}`)}} />}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        contentContainerStyle={[styles.listContainer, { paddingTop: 120 }]}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 16 }}>
            <Text style={[typography.caption, { color: colors.secondaryText, textAlign: 'center' }]}>
              {t("collection.myLibrary.noLists")}
            </Text>
          </View>
        )}
      />
      <CreateListBottomSheet ref={createListBottomSheetRef} />
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  myLibraryHeaderMenu: {
    alignItems: 'center',
  },
  stackContainer: {
    width: 260,
    height: 200,
    position: 'relative',
  },
  textContainer: {
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 128,
    paddingHorizontal: 16,
  },
});
