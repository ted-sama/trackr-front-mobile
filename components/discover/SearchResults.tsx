import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import BookListElement from '@/components/BookListElement';
import CollectionListElement from '@/components/CollectionListElement';
import UserListElement from '@/components/UserListElement';
import { useTypography } from '@/hooks/useTypography';
import { useSearch } from '@/hooks/queries/search';
import { Book } from '@/types/book';
import { List } from '@/types/list';
import { User } from '@/types/user';
import SkeletonLoader from '@/components/skeleton-loader/SkeletonLoader';
import { LegendList } from '@legendapp/list';

interface SearchResultsProps {
  searchQuery: string;
  activeFilter: 'books' | 'lists' | 'users';
}

export function SearchResults({ searchQuery, activeFilter }: SearchResultsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();

  const { data, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage, error } = useSearch(activeFilter, searchQuery);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const flatResults = (data?.pages || []).flatMap(p => p.data);

  const hasResults = flatResults.length > 0;

  const renderItem = ({ item }: { item: Book | List | User }) => {
    // Type guard to distinguish Book from List from User
    if ('authors' in item) {
      // It's a Book
      return (
        <BookListElement
          book={item as Book}
          showAuthor
          showRating
          showTrackingButton
          onPress={() => router.push(`/book/${item.id}`)}
        />
      );
    } else if ('books' in item || 'isPublic' in item) {
      // It's a List
      return (
        <CollectionListElement
          list={item as List}
          onPress={() => router.push(`/list/${item.id}`)}
          showDescription={true}
        />
      );
    } else {
      // It's a User
      return (
        <UserListElement
          user={item as User}
          onPress={() => router.push(`/profile/${(item as User).username}`)}
        />
      );
    }
  };

  if (isFetching && !hasResults && !error) {
    return (
      <View style={styles.listContainer}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <SkeletonLoader width={60} height={90} style={{ borderRadius: 4 }} />
              <View style={{ flex: 1, justifyContent: "space-between" }}>
                <View>
                  <SkeletonLoader width="80%" height={18} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="60%" height={14} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width="40%" height={14} />
                </View>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <SkeletonLoader width={24} height={24} style={{ borderRadius: 12 }} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <LegendList
      data={flatResults}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[typography.body, { color: colors.text }]}>
            {error ? String(error) : (searchQuery.trim() ? t("discover.search.noResults") : t("discover.search.empty"))}
          </Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.2}
      ListFooterComponent={isFetchingNextPage ? (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 64,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  footerContainer: {
    padding: 16,
  },
});
