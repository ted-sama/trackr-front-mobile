import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ListRenderItem,
} from "react-native";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useUserActivity, useUser } from "@/hooks/queries/users";
import { ActivityLog } from "@/types/activityLog";
import { router, useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import "dayjs/locale/en";
import {
  BookOpenIcon,
  StarIcon,
  BookCheck,
  HeartIcon,
  HeartMinusIcon,
  PlusIcon,
  MinusIcon,
  BookImageIcon,
} from "lucide-react-native";
import { snakeToCamel } from "@/utils/snakeToCamel";
import RatingStars from "@/components/ui/RatingStars";
import { useUserStore } from "@/stores/userStore";

dayjs.extend(relativeTime);

interface ActivityItemProps {
  activity: ActivityLog;
  isMe: boolean;
  userDisplayName?: string;
}

function getActivityIcon(action: string, colors: any) {
  const iconProps = { size: 20, color: colors.text };
  
  switch (action) {
    case "book.addedToLibrary":
      return <PlusIcon {...iconProps} color={colors.icon} />;
    case "book.removedFromLibrary":
      return <MinusIcon {...iconProps} color={colors.icon} />;
    case "book.addedToFavorites":
      return <HeartIcon {...iconProps} color={colors.icon} />;
    case "book.removedFromFavorites":
      return <HeartMinusIcon {...iconProps} color={colors.icon} />;
    case "book.statusUpdated":
      return <BookCheck {...iconProps} color={colors.icon} />;
    case "book.currentChapterUpdated":
      return <BookOpenIcon {...iconProps} color={colors.icon} />;
    case "book.ratingUpdated":
      return <StarIcon {...iconProps} color={colors.icon} />;
    default:
      return <BookImageIcon {...iconProps} />;
  }
}

interface ActivityContentProps {
  activity: ActivityLog;
  colors: any;
  isMe: boolean;
  userDisplayName?: string;
}

function ActivityContent({ activity, colors, isMe, userDisplayName }: ActivityContentProps) {
  const { t } = useTranslation();
  const typography = useTypography();
  const { action, metadata, resource } = activity;

  const baseStyle = [typography.body, { color: colors.text }];
  const keyPrefix = isMe ? "activity.me" : "activity.profile";
  const values = isMe ? {} : { user: userDisplayName || '' };
  
  switch (action) {
    case "book.addedToLibrary":
      return (
        <Text style={baseStyle}>
          <Trans 
            i18nKey={`${keyPrefix}.addedToLibrary`}
            values={{ ...values, title: resource.item.title }}
            components={{ bold: <Text style={typography.bodyBold2} /> }}
          />
        </Text>
      );
    case "book.removedFromLibrary":
      return (
        <Text style={baseStyle}>
          <Trans 
            i18nKey={`${keyPrefix}.removedFromLibrary`}
            values={{ ...values, title: resource.item.title }}
            components={{ bold: <Text style={typography.bodyBold2} /> }}
          />
        </Text>
      );
    case "book.addedToFavorites":
      return (
        <Text style={baseStyle}>
          <Trans 
            i18nKey={`${keyPrefix}.addedToFavorites`}
            values={{ ...values, title: resource.item.title }}
            components={{ bold: <Text style={typography.bodyBold2} /> }}
          />
        </Text>
      );
    case "book.removedFromFavorites":
      return (
        <Text style={baseStyle}>
          <Trans 
            i18nKey={`${keyPrefix}.removedFromFavorites`}
            values={{ ...values, title: resource.item.title }}
            components={{ bold: <Text style={typography.bodyBold2} /> }}
          />
        </Text>
      );
    case "book.statusUpdated":
      return (
        <Text style={baseStyle}>
          <Trans 
            i18nKey={`${keyPrefix}.statusUpdated`}
            values={{ 
              ...values,
              title: resource.item.title,
              status: t(`status.${snakeToCamel(metadata.status)}`).toLowerCase()
            }}
            components={{ bold: <Text style={typography.bodyBold2} /> }}
          />
        </Text>
      );
    case "book.currentChapterUpdated":
      return (
        <Text style={baseStyle}>
          <Trans 
            i18nKey={`${keyPrefix}.chapterUpdated`}
            values={{ 
              ...values,
              title: resource.item.title,
              chapter: metadata.currentChapter
            }}
            components={{ bold: <Text style={typography.bodyBold2} /> }}
          />
        </Text>
      );
    case "book.ratingUpdated":
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%" }}>
          <Text style={baseStyle}>
            <Trans 
              i18nKey={`${keyPrefix}.ratingUpdated`}
              values={{ 
                ...values,
                title: resource.item.title,
              }}
              components={{ bold: <Text style={typography.bodyBold2} /> }}
            />
            {" "}
            <RatingStars rating={metadata.rating} size={14} color={colors.text} />
          </Text>
        </View>
      );
    default:
      return <Text style={baseStyle}>{action}</Text>;
  }
}

const ActivityItem = ({ activity, isMe, userDisplayName }: ActivityItemProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { i18n } = useTranslation();

  const handlePress = () => {
    if (activity.resource.type === "book") {
      router.push(`/book/${activity.resource.item.id}`);
    }
  };

  const timeAgo = useMemo(() => {
    dayjs.locale(i18n.language);
    return dayjs(activity.createdAt).fromNow();
  }, [activity.createdAt, i18n.language]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.activityItem, { backgroundColor: colors.card }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        {getActivityIcon(activity.action, colors)}
      </View>
      <View style={styles.activityContent}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <ActivityContent activity={activity} colors={colors} isMe={isMe} userDisplayName={userDisplayName} />
        </View>
        <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
          {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ActivityPage() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const routerObj = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useUserStore();
  
  const isMe = useMemo(() => {
    if (!username || !currentUser) return true;
    return username === currentUser.username;
  }, [username, currentUser]);

  // Récupérer les infos de l'utilisateur si ce n'est pas moi
  const { data: user } = useUser(isMe ? '' : username || '');
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch,
  } = useUserActivity(username);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const activities = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

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

  const renderItem: ListRenderItem<ActivityLog> = useCallback(({ item }) => (
    <ActivityItem 
      activity={item} 
      isMe={isMe}
      userDisplayName={user?.displayName}
    />
  ), [isMe, user?.displayName]);

  const keyExtractor = useCallback((item: ActivityLog) => item.id, []);

  const ListHeader = useMemo(() => (
    <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
      <Text style={[typography.h1, { color: colors.text }]}>{t("activity.title")}</Text>
    </View>
  ), [typography.h1, colors.text, t]);

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
        <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>
          {t("activity.empty")}
        </Text>
      </View>
    );
  }, [isLoading, colors.accent, colors.secondaryText, typography.body, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      
      <AnimatedHeader
        title={t("activity.title")}
        scrollY={scrollY}
        onBack={() => routerObj.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.FlatList
        data={activities}
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
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
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
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
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

