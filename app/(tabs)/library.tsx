import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Platform, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import { getMyLibraryBooks } from '@/api';
import BookListElement from '@/components/BookListElement';
import BookListElementSkeleton from '@/components/skeleton-loader/BookListElementSkeleton';
import { Book } from '@/types';
import { useFocusEffect } from 'expo-router';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Book>);

export default function Library() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const scrollRef = useRef<FlatList<any>>(null);
  const handleBack = () => scrollRef.current?.scrollToOffset({ offset: 0, animated: true });

  // Pagination and fetching state
  const [books, setBooks] = useState<Book[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const fetchBooks = useCallback(async (newOffset = 0, append = false) => {
    setError(null);
    if (append) setIsFetchingMore(true); else setIsLoading(true);
    try {
      const response = await getMyLibraryBooks({ offset: newOffset, limit });
      setTotal(response.total);
      setOffset(newOffset + response.items.length);
      setBooks(prev => append ? [...prev, ...response.items] : response.items);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement de la bibliothèque');
    } finally {
      if (append) setIsFetchingMore(false); else setIsLoading(false);
    }
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      setBooks([]);
      setOffset(0);
      setTotal(0);
      fetchBooks(0, false);
    }, [fetchBooks])
  );

  const handleEndReached = () => {
    if (isFetchingMore || isLoading) return;
    if (books.length >= total) return;
    fetchBooks(offset, true);
  };

  const renderSkeletons = (count: number) => (
    <View style={{ marginTop: 12 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={{ marginBottom: 12 }}>
          <BookListElementSkeleton />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedHeader
        title="Bibliothèque"
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedFlatList
        ref={scrollRef}
        data={books}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Text
            style={[typography.h1, { color: colors.text, marginTop: Platform.OS === 'android' ? 70 : 50, marginBottom: 16 }]}
            onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
            accessibilityRole="header"
            accessibilityLabel="Library"
          >
            Bibliothèque
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <BookListElement book={item} onPress={() => {}} />
          </View>
        )}
        ListEmptyComponent={isLoading ? renderSkeletons(8) : error ? (
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 32 }}>{error}</Text>
        ) : (
          <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 32 }}>Aucun livre trouvé dans votre bibliothèque.</Text>
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={isFetchingMore ? renderSkeletons(2) : null}
        showsVerticalScrollIndicator={true}
        accessibilityRole="list"
      />
    </SafeAreaView>
  );
}
