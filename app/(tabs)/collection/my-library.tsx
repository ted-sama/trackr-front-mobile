import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, Platform, StyleSheet, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import Animated, { useSharedValue, useAnimatedScrollHandler, withTiming, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import BookListElement from '@/components/BookListElement';
import BookCard from '@/components/BookCard';
import { Book } from '@/types'; // Removed comment about BookTracking
import { useRouter, useFocusEffect } from 'expo-router'; // Added useFocusEffect
import { useTrackingStore } from '../../store/trackingStore'; // Adjusted path
import SwitchLayoutButton from '@/components/SwitchLayoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
// Removed direct API imports: addBookToTracking, removeBookFromTracking
// Toast might not be needed here if tracking actions are in child components

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
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">(DEFAULT_LAYOUT as "grid" | "list");
  
  const { 
    trackedBooks: booksMap, // Renamed to avoid conflict with the `books` array
    isLoading: isLoadingTrackedBooks, 
    error: errorTrackedBooks, 
    fetchTrackedBooks,
    getTrackedBooks // Selector to get books array
  } = useTrackingStore();

  // Get the array of books using the selector
  const books = getTrackedBooks();

  useFocusEffect(
    React.useCallback(() => {
      // Fetch if booksMap is empty or a refresh is needed
      if (Object.keys(booksMap).length === 0) {
        fetchTrackedBooks();
      }
    }, [fetchTrackedBooks, booksMap])
  );

  const [isBlurVisible, setIsBlurVisible] = useState(false);
  const blurOpacity = useSharedValue(0);

  // Animation d'opacité pour le flou
  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  // Load layout preference from AsyncStorage
  useEffect(() => {
    const loadLayoutPreference = async () => {
      const storedLayout = await AsyncStorage.getItem(LAYOUT_STORAGE_KEY) as "grid" | "list" | null;
      if (storedLayout) setCurrentLayout(storedLayout);
    };
    loadLayoutPreference();
  }, []);

  // Save layout preference to AsyncStorage
  useEffect(() => {
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, currentLayout);
  }, [currentLayout]);

  const handleBack = () => { // Added handleBack for AnimatedHeader
    router.back();
  };

  const switchLayout = () => {
    setIsBlurVisible(true);
    blurOpacity.value = 1; // Show blur immediately
    // Start fade out animation after a short delay
    setTimeout(() => {
      blurOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(setIsBlurVisible)(false); // Hide blur view after animation
        }
      });
    }, 50); // Small delay to ensure blur is visible before starting fade
    setCurrentLayout(currentLayout === 'grid' ? 'list' : 'grid');
  };
  
  // Conditional rendering for loading and error states
  if (isLoadingTrackedBooks && books.length === 0) { // Only show full screen loader if no books are displayed yet
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorTrackedBooks) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Erreur: {errorTrackedBooks}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedHeader
        title="Ma bibliothèque"
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined} // Use measured titleY
        onBack={handleBack}
      />
      <AnimatedList
        ref={scrollRef}
        data={books}
        key={currentLayout} // Ensures re-render on layout change
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ marginTop: insets.top, paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
        numColumns={currentLayout === 'grid' ? 3 : 1}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
            <Text
              style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
              accessibilityRole="header"
              accessibilityLabel="Ma bibliothèque" // Corrected label
              numberOfLines={1}
            >
              Ma bibliothèque
            </Text>
            <SwitchLayoutButton onPress={switchLayout} currentView={currentLayout} />
          </View>
        }
        renderItem={({ item }) =>
          currentLayout === 'grid' ? (
            <View style={{ width: '33.33%', padding: 2}}> 
              {/* Added padding for grid items if needed, or manage gap with columnWrapperStyle */}
              <BookCard 
                book={item} 
                onPress={() => { router.push(`/book/${item.id}`); }} 
                size="compact" 
                showAuthor={false} 
                showTrackingStatus={true} 
                showTrackingButton={false} // Tracking button usually not shown in library view directly on card
                showRating={false} 
              />
            </View>
          ) : (
            <BookListElement 
              book={item} 
              onPress={() => { router.push(`/book/${item.id}`); }} 
              showAuthor={true} // Show author in list view
              showTrackingStatus={true} 
              showTrackingButton={true} // Show tracking button in list view
              showRating={true} // Show rating in list view
            />
          )
        }
        ItemSeparatorComponent={currentLayout === 'grid' ? undefined : () => <View style={{ height: 12 }} />}
        ListEmptyComponent={!isLoadingTrackedBooks && books.length === 0 ? ( // Show only if not loading and books empty
          <View style={styles.centeredContainer}>
            <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 32 }}>Aucun livre trouvé dans votre bibliothèque.</Text>
          </View>
        ) : null}
        columnWrapperStyle={currentLayout === 'grid' ? { justifyContent: 'space-between' } : undefined}
        // onEndReached={() => {}} // Add pagination logic if needed
        // onEndReachedThreshold={0.2}
        ListFooterComponent={isLoadingTrackedBooks && books.length > 0 ? <ActivityIndicator style={{marginVertical: 20}} color={colors.primary}/> : null}
        showsVerticalScrollIndicator={true}
        accessibilityRole="list"
      />
      {isBlurVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle, { zIndex: 10 }]}
        pointerEvents="none">
          <BlurView intensity={40} tint={currentTheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: { // Added for centering loading/error/empty messages
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 70 : 70,
    marginBottom: 16,
  },
});