import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { toast } from 'sonner-native';
import {
  useMalFetch,
  useMalConfirmImport,
  MalFetchResponse,
  PendingImportBook,
} from '@/hooks/queries/malImport';
import { ChevronUp } from 'lucide-react-native';
import { useUIStore } from '@/stores/uiStore';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { BookItem } from '@/components/mal-import/BookItem';
import { ActionBar } from '@/components/mal-import/ActionBar';
import { SummaryCard } from '@/components/mal-import/SummaryCard';
import { Toolbar } from '@/components/mal-import/Toolbar';
import { NotFoundList } from '@/components/mal-import/NotFoundList';
import { GRID_COLUMNS, GRID_GAP } from '@/components/mal-import/constants';

export default function MalImport() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [fetchResult, setFetchResult] = useState<MalFetchResponse | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Use global layout preference from store (consistent with my-library)
  const currentLayout = useUIStore((state) => state.myLibraryLayout);
  const setLayout = useUIStore((state) => state.setMyLibraryLayout);
  const fetchMyLibraryBooks = useTrackedBooksStore((state) => state.fetchMyLibraryBooks);

  const switchLayout = () => {
    setLayout(currentLayout === 'grid' ? 'list' : 'grid');
  };

  const malFetchMutation = useMalFetch();
  const malConfirmMutation = useMalConfirmImport();

  const pendingBooks = fetchResult?.pendingBooks || [];

  const updateScrollTopVisibility = useCallback((offsetY: number) => {
    setShowScrollTop(offsetY > 400);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(updateScrollTopVisibility)(event.contentOffset.y);
    },
  });

  const validateUsername = (): string => {
    if (!username.trim()) {
      return t('auth.errors.requiredField');
    }
    if (username.length < 2) {
      return t('malImport.errors.usernameTooShort');
    }
    return '';
  };

  const handleFetch = async () => {
    const validationError = validateUsername();
    setError(validationError);

    if (validationError) {
      return;
    }

    try {
      const response = await malFetchMutation.mutateAsync(username.trim());

      if (response.pendingBooks.length > 0) {
        // Only show validation page if there are books to import
        setFetchResult(response);
        setSelectedBooks(new Set(response.pendingBooks.map((b) => b.bookId)));
        toast.success(t('malImport.foundBooks', { count: response.pendingBooks.length }));
      } else {
        // No new books - show message but stay on current page
        toast(t('malImport.noNewBooks'));
        // Show stats about already existing / not found
        if (response.alreadyExists > 0 || response.notFound > 0) {
          const parts = [];
          if (response.alreadyExists > 0) {
            parts.push(t('malImport.alreadyExistsCount', { count: response.alreadyExists }));
          }
          if (response.notFound > 0) {
            parts.push(t('malImport.notFoundCount', { count: response.notFound }));
          }
          toast(parts.join(' • '), { duration: 4000 });
        }
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      if (errorCode === 'MAL_USER_NOT_FOUND') {
        toast.error(t('malImport.errors.userNotFound'));
      } else if (errorCode === 'MAL_IMPORT_FAILED') {
        toast.error(t('malImport.errors.importFailed'));
      } else {
        toast.error(t('malImport.errors.generic'));
      }
    }
  };

  const handleToggleBook = useCallback((bookId: number) => {
    setSelectedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedBooks(new Set(pendingBooks.map((b) => b.bookId)));
  }, [pendingBooks]);

  const handleDeselectAll = useCallback(() => {
    setSelectedBooks(new Set());
  }, []);

  const handleConfirmImport = async () => {
    if (selectedBooks.size === 0) {
      toast.error(t('malImport.errors.noSelection'));
      return;
    }

    const booksToImport = pendingBooks.filter((b) => selectedBooks.has(b.bookId));

    try {
      const result = await malConfirmMutation.mutateAsync(booksToImport);
      toast.success(t('malImport.importSuccess', { count: result.imported }));
      await fetchMyLibraryBooks();
      router.replace('/(tabs)/collection');
    } catch (err) {
      toast.error(t('malImport.errors.importFailed'));
    }
  };

  const handleCancel = () => {
    if (fetchResult) {
      setFetchResult(null);
      setSelectedBooks(new Set());
    } else {
      router.back();
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderGridItem = useCallback(
    ({ item }: { item: PendingImportBook }) => (
      <BookItem
        book={item}
        isSelected={selectedBooks.has(item.bookId)}
        onToggle={handleToggleBook}
        viewMode="grid"
      />
    ),
    [selectedBooks, handleToggleBook]
  );

  const renderListItem = useCallback(
    ({ item }: { item: PendingImportBook }) => (
      <BookItem
        book={item}
        isSelected={selectedBooks.has(item.bookId)}
        onToggle={handleToggleBook}
        viewMode="list"
      />
    ),
    [selectedBooks, handleToggleBook]
  );

  const renderPendingBooks = () => {
    if (!fetchResult || pendingBooks.length === 0) return null;

    return (
      <View style={styles.resultsContainer}>
        <ActionBar
          selectedCount={selectedBooks.size}
          totalCount={pendingBooks.length}
          onCancel={handleCancel}
          onConfirm={handleConfirmImport}
          confirmDisabled={malConfirmMutation.isPending}
        />

        <SummaryCard
          foundCount={pendingBooks.length}
          alreadyExistsCount={fetchResult.details.alreadyExists.length}
          notFoundCount={fetchResult.details.notFound.length}
        />

        <Toolbar
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onSwitchLayout={switchLayout}
          currentLayout={currentLayout}
        />

        {/* Books */}
        {currentLayout === 'grid' ? (
          <FlatList
            key="grid"
            data={pendingBooks}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.bookId.toString()}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.gridRow}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContent}
          />
        ) : (
          <FlatList
            key="list"
            data={pendingBooks}
            renderItem={renderListItem}
            keyExtractor={(item) => item.bookId.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}

        {/* Not found list (collapsed) */}
        <NotFoundList titles={fetchResult.details.notFound} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      <AnimatedHeader
        title={t('malImport.title')}
        scrollY={scrollY}
        onBack={handleCancel}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.ScrollView
        ref={scrollViewRef as any}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 100,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
          <Text style={[typography.h1, { color: colors.text }]}>{t('malImport.title')}</Text>
        </View>

        {!fetchResult ? (
          <>
            <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 24 }]}>
              {t('malImport.description')}
            </Text>

            <TextField
              label={t('malImport.usernameLabel')}
              placeholder={t('malImport.usernamePlaceholder')}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError('');
              }}
              error={error}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title={malFetchMutation.isPending ? t('malImport.fetching') : t('malImport.fetchButton')}
              onPress={handleFetch}
              disabled={malFetchMutation.isPending || !username.trim()}
              style={{ marginTop: 24 }}
            />

            <Text
              style={[typography.caption, { color: colors.secondaryText, marginTop: 16, textAlign: 'center' }]}
            >
              {t('malImport.note')}
            </Text>
          </>
        ) : (
          renderPendingBooks()
        )}
      </Animated.ScrollView>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Pressable
          style={[styles.scrollTopButton, { backgroundColor: colors.accent }]}
          onPress={scrollToTop}
        >
          <ChevronUp size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 70,
    marginBottom: 16,
  },
  resultsContainer: {
    marginTop: 8,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridContent: {
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
