import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, Platform, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import BookListElement from '@/components/BookListElement';
import BookCard from '@/components/BookCard';
import { Book } from '@/types/book';
import { useRouter } from 'expo-router';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import SwitchLayoutButton from '@/components/SwitchLayoutButton';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from 'react-i18next';
import PillButton from '@/components/ui/PillButton';
import { ReadingStatus } from '@/types/reading-status';

const AnimatedList = Animated.createAnimatedComponent(FlatList<Book>);

export default function MyLibrary() {
  const router = useRouter();
  const { t } = useTranslation();
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
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>([]);

  const handleBack = () => {
    router.back();
  }

  // Subscribe to trackedBooks state directly so the component re-renders when it changes
  const trackedBooks = useTrackedBooksStore((state) => state.trackedBooks);
  const addTrackedBook = useTrackedBooksStore((state) => state.addTrackedBook);
  const removeTrackedBookFromStore = useTrackedBooksStore((state) => state.removeTrackedBook);
  
  const books = React.useMemo(() => {
    const booksArray = Object.values(trackedBooks);
    return booksArray
      .filter(book => book && book.id)
      .filter(book => selectedStatuses.length === 0 || selectedStatuses.includes(book.trackingStatus?.status as ReadingStatus));
  }, [trackedBooks, selectedStatuses]);

  const switchLayout = () => {
    const newLayout = currentLayout === 'grid' ? 'list' : 'grid';
    setLayout(newLayout);
  };

  const toggleStatus = (status: ReadingStatus) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const statusOptions: { key: ReadingStatus; label: string }[] = [
    { key: 'reading', label: t('status.reading') },
    { key: 'plan_to_read', label: t('status.planToRead') },
    { key: 'completed', label: t('status.completed') },
    { key: 'on_hold', label: t('status.onHold') },
    { key: 'dropped', label: t('status.dropped') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedHeader
        title={t("collection.myLibrary.title")}
        scrollY={scrollY}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        onBack={handleBack}
      />
      <AnimatedList
        ref={scrollRef}
        data={books}
        key={currentLayout}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ marginTop: insets.top, paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
        numColumns={currentLayout === 'grid' ? 3 : 1}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View>
            <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
              <Text
                style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
                accessibilityRole="header"
                accessibilityLabel="Library"
                numberOfLines={1}
              >
                {t("collection.myLibrary.title")}
              </Text>
              <SwitchLayoutButton onPress={switchLayout} currentView={currentLayout} />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={styles.statusFilters}
            >
              {statusOptions.map((status) => (
                <PillButton
                  key={status.key}
                  title={status.label}
                  toggleable={true}
                  selected={selectedStatuses.includes(status.key)}
                  onPress={() => toggleStatus(status.key)}
                />
              ))}
            </ScrollView>
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
          <Text style={[typography.body, {color: colors.secondaryText, textAlign: 'center', marginTop: 32 }]}>{t("collection.myLibrary.noBooks")}</Text>
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
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
});