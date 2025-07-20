import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import Animated, { useSharedValue, useAnimatedScrollHandler, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import BookListElement from '@/components/BookListElement';
import BookCard from '@/components/BookCard';
import { Book } from '@/types/book';
import { useRouter } from 'expo-router';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import SwitchLayoutButton from '@/components/SwitchLayoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useUIStore } from '@/stores/uiStore';

// AsyncStorage key for layout preference
const LAYOUT_STORAGE_KEY = '@MyApp:layoutPreference';

// Default layout preference
const DEFAULT_LAYOUT = 'list';

const AnimatedList = Animated.createAnimatedComponent(FlatList<Book>);

export default function MyLibrary() {
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<FlatList<Book> | null>(null);
  const currentLayout = useUIStore(state => state.myLibraryLayout);
  const setLayout = useUIStore(state => state.setMyLibraryLayout);
  // scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  const handleBack = () => {
    router.back();
  }

  const { getTrackedBooks, addTrackedBook, removeTrackedBook: removeTrackedBookFromStore } = useTrackedBooksStore();
  const books = getTrackedBooks();
  console.log(books);

  // Load saved layout preference
  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_STORAGE_KEY).then((layout) => {
      if (layout === 'grid' || layout === 'list') setLayout(layout);
    });
  }, [setLayout]);

  // Persist layout changes
  useEffect(() => {
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, currentLayout);
  }, [currentLayout]);

  const switchLayout = () => {
    const newLayout = currentLayout === 'grid' ? 'list' : 'grid';
    setLayout(newLayout);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedHeader
        title="Ma bibliothèque"
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedList
        ref={scrollRef}
        data={books}
        key={currentLayout}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ marginTop: insets.top, paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
        numColumns={currentLayout === 'grid' ? 3 : 1}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
            <Text
              style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
              accessibilityRole="header"
              accessibilityLabel="Library"
              numberOfLines={1}
            >
              Ma bibliothèque
            </Text>
            <SwitchLayoutButton onPress={switchLayout} currentView={currentLayout} />
          </View>
        }
        renderItem={({ item }) =>
          currentLayout === 'grid' ? (
            <View style={{ width: '33%' }}>
              <BookCard book={item} onPress={() => { router.push(`/book/${item.id}`); }} size="compact" showAuthor={false} showTrackingStatus={true} showTrackingButton={false} showRating={false} />
            </View>
          ) : (
            <BookListElement book={item} onPress={() => { router.push(`/book/${item.id}`); }} showAuthor={false} showTrackingStatus={true} showTrackingButton={false} showRating={false} />
          )
        }
        ItemSeparatorComponent={currentLayout === 'grid' ? () => <View style={{ height: 26 }} /> : () => <View style={{ height: 12 }} />}
        ListEmptyComponent={books.length === 0 ? (
          <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 32 }}>Aucun livre trouvé dans votre bibliothèque.</Text>
        ) : null}
        columnWrapperStyle={currentLayout === 'grid' ? { gap: 4 } : undefined}
        onEndReached={() => {}}
        onEndReachedThreshold={0.2}
        ListFooterComponent={null}
        showsVerticalScrollIndicator={true}
        accessibilityRole="list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 70 : 70,
    marginBottom: 16,
  },
});