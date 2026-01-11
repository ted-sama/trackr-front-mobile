import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import UserListItem from '@/components/UserListItem';
import SearchBar from '@/components/ui/SearchBar';
import { useUserFollowing, useFollowUser, useUnfollowUser } from '@/hooks/queries/follows';
import { useUser } from '@/hooks/queries/users';
import { User } from '@/types/user';
import { useTranslation } from 'react-i18next';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type UserWithRelationship = User & { isFollowedByMe?: boolean; isFriend?: boolean };

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<UserWithRelationship>);

export default function FollowingScreen() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { userId, username } = useLocalSearchParams<{ userId: string; username: string }>();
  const { data: user } = useUser(userId);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);
  const {
    data,
    isLoading,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserFollowing(username || user?.username || '', debouncedSearch || undefined);

  // Only show full page loader on initial load (no data yet)
  const showFullPageLoader = isLoading && !data;
  const [titleY, setTitleY] = useState<number>(0);
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const users = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  // Always show total following count from user profile, not from search results
  const totalCount = user?.followingCount ?? 0;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleBack = () => {
    router.back();
  };

  const handleUserPress = (targetUser: UserWithRelationship) => {
    router.push({
      pathname: '/profile/[userId]',
      params: { userId: targetUser.username },
    });
  };

  const handleFollowPress = useCallback(async (targetUser: UserWithRelationship) => {
    if (loadingUsers.has(targetUser.id)) return;

    setLoadingUsers(prev => new Set(prev).add(targetUser.id));

    try {
      if (targetUser.isFollowedByMe) {
        await unfollowMutation.mutateAsync(targetUser.username);
      } else {
        await followMutation.mutateAsync(targetUser.username);
      }
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  }, [loadingUsers, followMutation, unfollowMutation]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: UserWithRelationship }) => (
    <UserListItem
      user={item}
      onPress={() => handleUserPress(item)}
      showFollowButton={true}
      onFollowPress={() => handleFollowPress(item)}
      followLoading={loadingUsers.has(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center' }]}>
        {t('profile.noFollowingResults')}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.body, { color: colors.error, textAlign: 'center' }]}>
        {t('common.error')}
      </Text>
      <Text style={[typography.body, { color: colors.secondaryText, textAlign: 'center', marginTop: 8 }]}>
        {t('common.loadingError')}
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

  const displayName = user?.displayName || user?.username || username;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t('profile.followingTitle', { username: displayName })}
        subtitle={totalCount > 0 ? t('profile.followingCount', { count: totalCount }) : undefined}
        scrollY={scrollY}
        onBack={handleBack}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      {showFullPageLoader ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <AnimatedFlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ marginTop: insets.top, paddingBottom: 64, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Search Bar */}
              <SearchBar
                placeholder={t('profile.searchFollowing')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={styles.searchBar}
              />

              {/* Title and count */}
              <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
                <Text
                  style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
                  accessibilityRole="header"
                  accessibilityLabel="Following"
                  numberOfLines={1}
                >
                  {t('profile.following')}
                </Text>
                {totalCount > 0 && (
                  <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
                    {t('profile.followingCount', { count: totalCount })}
                  </Text>
                )}
              </View>
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
  headerContainer: {
    marginTop: 80,
    paddingHorizontal: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 32,
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
