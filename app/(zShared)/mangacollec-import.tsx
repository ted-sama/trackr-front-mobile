import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { toast } from 'sonner-native';
import { useMalConfirmImport, MalFetchResponse, PendingImportBook } from '@/hooks/queries/malImport';
import { useMangacollecStartImport } from '@/hooks/queries/mangacollecImport';
import { useMangacollecImportStore } from '@/stores/mangacollecImportStore';
import { ChevronUp, Sparkles } from 'lucide-react-native';
import { useUIStore } from '@/stores/uiStore';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { BookItem } from '@/components/mal-import/BookItem';
import { ActionBar } from '@/components/mal-import/ActionBar';
import { SummaryCard } from '@/components/mal-import/SummaryCard';
import { Toolbar } from '@/components/mal-import/Toolbar';
import { NotFoundList } from '@/components/mal-import/NotFoundList';
import { ImportLoadingState } from '@/components/mal-import/ImportLoadingState';
import { GRID_COLUMNS, GRID_GAP } from '@/components/mal-import/constants';

export default function MangacollecImport() {
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
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const tipOpacity = useSharedValue(1);

  // Read from global store (populated by background watcher)
  const importStatus = useMangacollecImportStore((s) => s.status);
  const importResult = useMangacollecImportStore((s) => s.result);
  const importError = useMangacollecImportStore((s) => s.error);
  const startJob = useMangacollecImportStore((s) => s.startJob);
  const clearImport = useMangacollecImportStore((s) => s.clear);

  const currentLayout = useUIStore((state) => state.myLibraryLayout);
  const setLayout = useUIStore((state) => state.setMyLibraryLayout);
  const fetchMyLibraryBooks = useTrackedBooksStore((state) => state.fetchMyLibraryBooks);

  const switchLayout = () => {
    setLayout(currentLayout === 'grid' ? 'list' : 'grid');
  };

  const startImportMutation = useMangacollecStartImport();
  const malConfirmMutation = useMalConfirmImport();

  // React to store completion/failure (from background watcher)
  useEffect(() => {
    if (importStatus === 'completed' && importResult && !fetchResult) {
      handleImportCompleted(importResult);
    } else if (importStatus === 'failed' && importError) {
      toast.error(importError || t('mangacollecImport.errors.importFailed'));
      clearImport();
    }
  }, [importStatus, importResult, importError]);

  const handleImportCompleted = (result: MalFetchResponse) => {
    if (result.pendingBooks.length > 0) {
      setFetchResult(result);
      setSelectedBooks(new Set(result.pendingBooks.map((b) => b.bookId)));
      toast.success(t('mangacollecImport.foundBooks', { count: result.pendingBooks.length }));
    } else {
      toast(t('mangacollecImport.noNewBooks'));
      if (result.alreadyExists > 0 || result.notFound > 0) {
        const parts = [];
        if (result.alreadyExists > 0) {
          parts.push(t('mangacollecImport.alreadyExistsCount', { count: result.alreadyExists }));
        }
        if (result.notFound > 0) {
          parts.push(t('mangacollecImport.notFoundCount', { count: result.notFound }));
        }
        toast(parts.join(' \u2022 '), { duration: 4000 });
      }
      clearImport();
    }
  };

  const loadingTips = useMemo(
    () => [
      t('mangacollecImport.loadingTips.scraping'),
      t('mangacollecImport.loadingTips.matching'),
      t('mangacollecImport.loadingTips.translating'),
      t('mangacollecImport.loadingTips.patience'),
    ],
    [t]
  );

  const pendingBooks = fetchResult?.pendingBooks || [];

  const isLoading = importStatus === 'processing' || startImportMutation.isPending;

  // Rotate tips while loading
  useEffect(() => {
    if (!isLoading || loadingTips.length <= 1) return;

    const interval = setInterval(() => {
      tipOpacity.value = withTiming(0, { duration: 300 }, () => {
        tipOpacity.value = withTiming(1, { duration: 300 });
      });
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % loadingTips.length);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading, loadingTips]);

  const tipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tipOpacity.value,
  }));

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
      return t('mangacollecImport.errors.usernameTooShort');
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
      const response = await startImportMutation.mutateAsync(username.trim());
      startJob(response.jobId);
    } catch (err: any) {
      toast.error(t('mangacollecImport.errors.generic'));
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
      toast.error(t('mangacollecImport.errors.noSelection'));
      return;
    }

    const booksToImport = pendingBooks.filter((b) => selectedBooks.has(b.bookId));

    try {
      const result = await malConfirmMutation.mutateAsync(booksToImport);
      toast.success(t('mangacollecImport.importSuccess', { count: result.imported }));
      clearImport();
      await fetchMyLibraryBooks();
      router.replace('/(tabs)/collection');
    } catch (err) {
      toast.error(t('mangacollecImport.errors.importFailed'));
    }
  };

  const handleCancel = () => {
    if (fetchResult) {
      setFetchResult(null);
      setSelectedBooks(new Set());
      clearImport();
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

        <NotFoundList titles={fetchResult.details.notFound} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      <AnimatedHeader
        title={t('mangacollecImport.title')}
        scrollY={scrollY}
        onBack={handleCancel}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.ScrollView
        ref={scrollViewRef as any}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollEnabled={!isLoading}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 100,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
          <Text style={[typography.h1, { color: colors.text }]}>{t('mangacollecImport.title')}</Text>
        </View>

        {!fetchResult ? (
          isLoading ? (
            <ImportLoadingState
              title={t('mangacollecImport.loadingTitle')}
              subtitle={t('mangacollecImport.loadingSubtitle')}
            />
          ) : (
            <>
              <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 24 }]}>
                {t('mangacollecImport.description')}
              </Text>

              <TextField
                label={t('mangacollecImport.usernameLabel')}
                placeholder={t('mangacollecImport.usernamePlaceholder')}
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
                title={t('mangacollecImport.fetchButton')}
                onPress={handleFetch}
                disabled={!username.trim()}
                style={{ marginTop: 24 }}
              />

              <Text
                style={[typography.caption, { color: colors.secondaryText, marginTop: 16, textAlign: 'center' }]}
              >
                {t('mangacollecImport.note')}
              </Text>
            </>
          )
        ) : (
          renderPendingBooks()
        )}
      </Animated.ScrollView>

      {isLoading && (
        <View style={[styles.tipsWrapper, { bottom: insets.bottom + 20 }]}>
          <Animated.View
            style={[
              styles.tipsPill,
              { backgroundColor: colors.card, borderColor: colors.border },
              tipAnimatedStyle,
            ]}
          >
            <Sparkles size={14} color={colors.secondaryText} />
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {loadingTips[currentTipIndex]}
            </Text>
          </Animated.View>
        </View>
      )}

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
  tipsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tipsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
