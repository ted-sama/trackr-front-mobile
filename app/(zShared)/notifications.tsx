import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItem,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell } from "lucide-react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import PillButton from "@/components/ui/PillButton";
import {
  useNotifications,
  useMarkAllAsRead,
  useUnreadCount,
} from "@/hooks/queries/notifications";
import NotificationItem from "@/components/notifications/NotificationItem";
import type { Notification } from "@/types/notification";

export default function NotificationsScreen() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const routerObj = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data: unreadCount = 0 } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useNotifications();

  const notifications = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem: ListRenderItem<Notification> = useCallback(
    ({ item }) => <NotificationItem notification={item} />,
    []
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const MarkAllReadButton = useMemo(() => {
    return (
      <PillButton
        title={t("notifications.markAllRead")}
        onPress={handleMarkAllAsRead}
        disabled={unreadCount === 0}
      />
    );
  }, [unreadCount, t]);

  const ListHeader = useMemo(
    () => (
      <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
        <Text style={[typography.h1, { color: colors.text }]}>
          {t("notifications.title")}
        </Text>
      </View>
    ),
    [typography.h1, colors.text, t]
  );

  const ListFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, colors.accent]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Bell size={48} color={colors.secondaryText} style={{ marginBottom: 16 }} />
        <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>
          {t("notifications.empty")}
        </Text>
      </View>
    );
  }, [isLoading, colors.accent, colors.secondaryText, typography.body, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t("notifications.title")}
        scrollY={scrollY}
        onBack={() => routerObj.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
        rightComponent={MarkAllReadButton}
      />

      <Animated.FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 64,
          paddingHorizontal: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={insets.top}
          />
        }
      />
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
