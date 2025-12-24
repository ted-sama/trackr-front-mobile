import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";
import Badge from "@/components/ui/Badge";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import i18n from '@/i18n';
import { useTranslation } from "react-i18next";
import { BookChatUsage } from "@/hooks/queries/subscription";

dayjs.extend(relativeTime);

const DEFAULT_COVER_COLOR = '#6B7280';

interface ChatUsageBookItemProps {
  item: BookChatUsage;
  onPress: () => void;
}

export default function ChatUsageBookItem({ item, onPress }: ChatUsageBookItemProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const scale = useSharedValue(1);
  const { t } = useTranslation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasCover = Boolean(item.book?.coverImage);

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      dayjs.locale(i18n.language);
      return dayjs(dateString).fromNow();
    } catch {
      return null;
    }
  };

  const lastUsed = formatLastUsed(item.lastUsedAt);

  if (!item.book) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 220 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
        style={styles.container}
      >
        <View style={styles.row}>
          {hasCover ? (
            <Image source={{ uri: item.book.coverImage }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.noCoverContainer, { backgroundColor: DEFAULT_COVER_COLOR }]}>
              <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.5)" />
            </View>
          )}
          <View style={styles.infoContainer}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 2 }]} numberOfLines={2} ellipsizeMode="tail">
              {item.book.title}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <Badge
            text={`${item.monthlyRequests} ${t('chat.usage.thisMonth')}`}
            color={colors.accent}
            backgroundColor={colors.badgeBackground}
            borderColor={colors.badgeBorder}
          />
          <Badge
            text={`${item.totalRequests} ${t('chat.usage.allTime')}`}
            color={colors.badgeText}
            backgroundColor={colors.badgeBackground}
            borderColor={colors.badgeBorder}
          />
          {lastUsed && (
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {lastUsed}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 40,
    height: 60,
    borderRadius: 4,
  },
  noCoverContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    marginHorizontal: 8,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
});
