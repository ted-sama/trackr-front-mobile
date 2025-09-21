import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import CollectionListElement from '@/components/CollectionListElement';
import { useMyLists } from '@/hooks/queries/lists';
import { List } from '@/types/list';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<List>);

export default function UserListsScreen() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useMyLists();
  const [titleY, setTitleY] = useState<number>(0);
  const lists = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);
  
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleBack = () => {
    router.back();
  };

  const handleListPress = (list: List) => {
    router.push(`/list-full?id=${list.id}`);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: List }) => (
    <View style={styles.listItemContainer}>
      <CollectionListElement
        list={item}
        onPress={() => handleListPress(item)}
        size="default"
        showDescription={true}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.h3, { color: colors.secondaryText, textAlign: 'center' }]}>
        Aucune liste trouvée
      </Text>
      <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
        Créez votre première liste pour commencer à organiser vos livres
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.h3, { color: colors.error, textAlign: 'center' }]}>
        Erreur de chargement
      </Text>
      <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
        Impossible de charger vos listes
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      
      <AnimatedHeader
        title="Listes"
        scrollY={scrollY}
        onBack={handleBack}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      {isLoading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <AnimatedFlatList
          data={lists}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ marginTop: insets.top, paddingHorizontal: 16, paddingBottom: 64, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
              <Text
                style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
                accessibilityRole="header"
                accessibilityLabel="Lists"
                numberOfLines={1}
              >
                Listes
              </Text>
            </View>
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 70 : 70,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listItemContainer: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
