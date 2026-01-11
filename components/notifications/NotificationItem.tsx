import React, { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Heart, Bookmark, UserPlus, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import "dayjs/locale/en";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useMarkAsRead } from "@/hooks/queries/notifications";
import Avatar from "@/components/ui/Avatar";
import type { Notification } from "@/types/notification";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

interface NotificationItemProps {
  notification: Notification;
}

function getNotificationIcon(type: string, colors: any) {
  const iconProps = { size: 16, color: colors.icon };

  switch (type) {
    case "review_like":
    case "list_like":
      return <Heart {...iconProps} fill={colors.accent} color={colors.accent} />;
    case "list_save":
      return <Bookmark {...iconProps} fill={colors.accent} color={colors.accent} />;
    case "new_follower":
      return <UserPlus {...iconProps} fill={colors.accent} color={colors.accent} />;
    case "new_friend":
      return <Users {...iconProps} fill={colors.accent} color={colors.accent} />;
    default:
      return <Heart {...iconProps} />;
  }
}

function NotificationItemComponent({ notification }: NotificationItemProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const markAsRead = useMarkAsRead();
  const { t, i18n } = useTranslation();

  const handlePress = () => {
    Haptics.selectionAsync();

    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on type
    if (notification.type === "new_follower" || notification.type === "new_friend") {
      router.push(`/profile/${notification.actor.username}`);
    } else if (notification.resourceType === "book_review" && notification.resource?.book) {
      router.push(`/book/${notification.resource.book.id}`);
    } else if (notification.resourceType === "list") {
      router.push(`/list/${notification.resourceId}`);
    }
  };

  const timeAgo = useMemo(() => {
    dayjs.locale(i18n.language);
    return dayjs(notification.createdAt).fromNow();
  }, [notification.createdAt, i18n.language]);

  const renderMessage = () => {
    const actorName = notification.actor.displayName || notification.actor.username;

    switch (notification.type) {
      case "review_like":
        return (
          <Text style={[typography.body, { color: colors.text }]}>
            <Text style={typography.bodyBold2}>{actorName}</Text>
            {" " + t("notifications.likedYourReview")}
            {notification.resource?.book && (
              <Text>
                {" " + t("notifications.of") + " "}
                <Text style={typography.bodyBold2}>{notification.resource.book.title}</Text>
              </Text>
            )}
          </Text>
        );
      case "list_like":
        return (
          <Text style={[typography.body, { color: colors.text }]}>
            <Text style={typography.bodyBold2}>{actorName}</Text>
            {" " + t("notifications.likedYourList") + " "}
            {notification.resource?.name && (
              <Text style={typography.bodyBold2}>{notification.resource.name}</Text>
            )}
          </Text>
        );
      case "list_save":
        return (
          <Text style={[typography.body, { color: colors.text }]}>
            <Text style={typography.bodyBold2}>{actorName}</Text>
            {" " + t("notifications.savedYourList") + " "}
            {notification.resource?.name && (
              <Text style={typography.bodyBold2}>{notification.resource.name}</Text>
            )}
          </Text>
        );
      case "new_follower":
        return (
          <Text style={[typography.body, { color: colors.text }]}>
            <Text style={typography.bodyBold2}>{actorName}</Text>
            {" " + t("notifications.startedFollowingYou")}
          </Text>
        );
      case "new_friend":
        return (
          <Text style={[typography.body, { color: colors.text }]}>
            <Text style={typography.bodyBold2}>{actorName}</Text>
            {" " + t("notifications.isNowYourFriend")}
          </Text>
        );
      default:
        return (
          <Text style={[typography.body, { color: colors.text }]}>
            {t("notifications.new")}
          </Text>
        );
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, { backgroundColor: colors.card }]}
      activeOpacity={0.7}
    >
      {/* Avatar with icon badge */}
      <View style={styles.avatarContainer}>
        <Avatar image={notification.actor.avatar || undefined} size={40} />
        <View style={[styles.iconBadge, { backgroundColor: colors.background }]}>
          {getNotificationIcon(notification.type, colors)}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {renderMessage()}
        </View>
        <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 4 }]}>
          {timeAgo}
        </Text>
      </View>

      {/* Unread indicator */}
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  iconBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});

export default React.memo(NotificationItemComponent);
