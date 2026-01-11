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
import { useUserFollowers, useFollowUser, useUnfollowUser } from '@/hooks/queries/follows';
import { useUser } from '@/hooks/queries/users';
import { User } from '@/types/user';
import { useTranslation } from 'react-i18next';

type UserWithRelationship = User & { isFollowedByMe?: boolean; isFriend?: boolean };

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<UserWithRelationship>);

export default function FollowersScreen() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { userId, username } = useLocalSearchParams<{ userId: string; username: string }>();
  const { data: user } = useUser(userId);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserFollowers(username || user?.username || '');
  const [titleY, setTitleY] = useState<number>(0);
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const users = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.meta?.total ?? 0;

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
      <Text style={[typography.h3, { color: colors.secondaryText, textAlign: 'center' }]}>
        {t('profile.noFollowers')}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <Text style={[typography.h3, { color: colors.error, textAlign: 'center' }]}>
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
        title={t('profile.followersTitle', { username: displayName })}
        subtitle={totalCount > 0 ? t('profile.followersCount', { count: totalCount }) : undefined}
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
            <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
              <Text
                style={[typography.h1, { color: colors.text, maxWidth: '80%' }]}
                accessibilityRole="header"
                accessibilityLabel="Followers"
                numberOfLines={1}
              >
                {t('profile.followers')}
              </Text>
              {totalCount > 0 && (
                <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
                  {t('profile.followersCount', { count: totalCount })}
                </Text>
              )}
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
    marginTop: Platform.OS === 'android' ? 70 : 70,
    marginBottom: 16,
    paddingHorizontal: 16,
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
