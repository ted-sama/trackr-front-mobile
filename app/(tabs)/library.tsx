import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import Animated, { useSharedValue, useAnimatedScrollHandler, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import { getMyLibraryBooks } from '@/api';
import BookListElement from '@/components/BookListElement';
import BookListElementSkeleton from '@/components/skeleton-loader/BookListElementSkeleton';
import BookCard from '@/components/BookCard';
import { Book } from '@/types';
import { useRouter } from 'expo-router';
import { useTrackedBooksStore } from '@/state/tracked-books-store';
import SwitchLayoutButton from '@/components/SwitchLayoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

// AsyncStorage key for layout preference
const LAYOUT_STORAGE_KEY = '@MyApp:layoutPreference';

// Default layout preference
const DEFAULT_LAYOUT = 'list';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Book>);

export default function Library() {
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<FlatList<any>>(null);
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">(DEFAULT_LAYOUT as "grid" | "list");
  const handleBack = () => scrollRef.current?.scrollToOffset({ offset: 0, animated: true });

  const { getTrackedBooks, addTrackedBook } = useTrackedBooksStore();
  const books = getTrackedBooks();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBlurVisible, setIsBlurVisible] = useState(false);
  const blurOpacity = useSharedValue(0);

  // Animation d'opacité pour le flou
  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  useEffect(() => {
    let isMounted = true;
    async function fetchInitialBooks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getMyLibraryBooks({ offset: 0, limit: 1000 });
        if (isMounted) {
          response.items.forEach(book => addTrackedBook({ ...book, tracking: true }));
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Erreur de chargement de la bibliothèque');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchInitialBooks();
    return () => { isMounted = false; };
  }, [addTrackedBook]);

  // Load layout preference from AsyncStorage
  useEffect(() => {
    const loadLayoutPreference = async () => {
      const storedLayout: "grid" | "list" = await AsyncStorage.getItem(LAYOUT_STORAGE_KEY) as "grid" | "list";
      if (storedLayout) setCurrentLayout(storedLayout);
    };
    loadLayoutPreference();
  }, []);

  // Save layout preference to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, currentLayout);
  }, [currentLayout]);

  const renderSkeletons = (count: number) => (
    <View style={{ marginTop: 12 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={{ marginBottom: 12 }}>
          <BookListElementSkeleton />
        </View>
      ))}
    </View>
  );

  const switchLayout = () => {
    setIsBlurVisible(true);
    blurOpacity.value = 1;
    setTimeout(() => {
      blurOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(setIsBlurVisible)(false);
      });
    }, 50);
    setCurrentLayout(currentLayout === 'grid' ? 'list' : 'grid');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedHeader
        title="Ma bibliothèque"
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedFlatList
        ref={scrollRef}
        data={books}
        key={currentLayout}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
        numColumns={currentLayout === 'grid' ? 3 : 1}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
            <Text
              style={[typography.h1, { color: colors.text }]}
              accessibilityRole="header"
              accessibilityLabel="Library"
            >
              Ma bibliothèque
            </Text>
            <SwitchLayoutButton onPress={switchLayout} currentView={currentLayout} />
          </View>
        }
        renderItem={({ item }) =>
          currentLayout === 'grid' ? (
            <BookCard book={item} onPress={() => { router.push(`/book/${item.id}`); }} size="compact" showTrackingButton={false} showRating={false} />
          ) : (
            <BookListElement book={item} onPress={() => { router.push(`/book/${item.id}`); }} showTrackingButton={false} />
          )
        }
        ItemSeparatorComponent={currentLayout === 'grid' ? () => <View style={{ height: 18 }} /> : () => <View style={{ height: 12 }} />}
        ListEmptyComponent={isLoading ? renderSkeletons(8) : error ? (
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 32 }}>{error}</Text>
        ) : (
          <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 32 }}>Aucun livre trouvé dans votre bibliothèque.</Text>
        )}
        columnWrapperStyle={currentLayout === 'grid' ? { justifyContent: 'space-between' } : undefined}
        onEndReached={() => {}}
        onEndReachedThreshold={0.2}
        ListFooterComponent={null}
        showsVerticalScrollIndicator={true}
        accessibilityRole="list"
      />
      {isBlurVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle, { zIndex: 10 }]}
        pointerEvents="none">
          <BlurView intensity={40} tint={currentTheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </SafeAreaView>
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