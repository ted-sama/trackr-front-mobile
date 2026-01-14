import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions } from "react-native";
import { router } from "expo-router";
import {
  Users,
  MessageSquare,
  BookCheck,
  BookOpenIcon,
  Pause,
  Square,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useBookReaders } from "@/hooks/queries/readers";
import { BookReaderItem } from "@/types/reader";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import { useTranslation } from "react-i18next";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
import DotSeparator from "@/components/ui/DotSeparator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Card dimensions
const READER_CARD_SIZE = 72;
const READER_CARD_GAP = 12;

interface ReadBySectionProps {
  bookId: string;
}

interface ReaderCardProps {
  reader: BookReaderItem;
  bookId: string;
}

function ReaderCard({ reader, bookId }: ReaderCardProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const scale = useSharedValue(1);

  // Get status icon and color
  const getStatusIcon = () => {
    const iconSize = 10;
    const strokeWidth = 2.5;

    switch (reader.status) {
      case "completed":
        return <BookCheck size={iconSize} color={colors.completed} strokeWidth={strokeWidth} />;
      case "reading":
        return <BookOpenIcon size={iconSize} color={colors.reading} strokeWidth={strokeWidth} />;
      case "on_hold":
        return <Pause size={iconSize} color={colors.onHold} strokeWidth={strokeWidth} />;
      case "dropped":
        return <Square size={iconSize} color={colors.dropped} strokeWidth={strokeWidth} />;
      default:
        return null;
    }
  };

  // Determine progress text to display
  const getProgressInfo = () => {
    // For completed status, show "Completed" text
    if (reader.status === "completed") {
      return { text: t("status.completed"), icon: getStatusIcon() };
    }
    // For other statuses with a chapter, show chapter number
    if (reader.currentChapter && reader.status !== "plan_to_read") {
      return { text: `Ch. ${reader.currentChapter}`, icon: getStatusIcon() };
    }
    return null;
  };

  const progressInfo = getProgressInfo();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 220 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 220 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to review if present, otherwise to profile
    if (reader.hasReview && reader.reviewId) {
      router.push({
        pathname: '/book/[id]/review/[reviewId]',
        params: { id: bookId, reviewId: reader.reviewId },
      });
    } else {
      router.push(`/profile/${reader.user.username}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.readerCard, animatedStyle]}>
        {/* Avatar with simple border */}
        <Avatar
          image={reader.user.avatar ?? undefined}
          size={READER_CARD_SIZE - 8}
          borderWidth={1}
          borderColor={colors.border}
        />

        {/* Username */}
        <Text
          style={[typography.caption, styles.username, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {reader.user.displayName || reader.user.username}
        </Text>

        {/* Progress indicator (chapter or completed) */}
        {progressInfo && (
          <View style={styles.progressRow}>
            {progressInfo.icon}
            <Text
              style={[
                typography.caption,
                styles.progressText,
                { color: colors.secondaryText },
              ]}
            >
              {progressInfo.text}
            </Text>
          </View>
        )}

        {/* Rating and review indicator row */}
        {(reader.rating !== null || reader.hasReview) && (
          <View style={styles.ratingRow}>
            {reader.rating !== null && (
              <StarRating rating={reader.rating} size={10} color={colors.secondaryText} />
            )}
            {reader.hasReview && (
              <MessageSquare
                size={10}
                color={colors.secondaryText}
                fill={colors.secondaryText}
                style={{ marginLeft: reader.rating !== null ? 4 : 0 }}
              />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function ReadBySection({ bookId }: ReadBySectionProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const { data, isLoading } = useBookReaders(bookId, 20);

  // Don't render if no readers
  if (!isLoading && (!data || data.total === 0)) {
    return null;
  }

  const renderReaderItem = ({ item }: { item: BookReaderItem }) => (
    <ReaderCard reader={item} bookId={bookId} />
  );

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Users size={20} color={colors.text} strokeWidth={2} />
          <Text
            style={[
              typography.categoryTitle,
              { color: colors.text, marginLeft: 8 },
            ]}
          >
            {t("book.readBy")}
          </Text>
          {data?.total != null && data.total > 0 && (
            <>
              <DotSeparator />
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {data.total} {data.total === 1 ? t("book.following_singular") : t("book.following_plural")}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Readers List - Horizontal Scroll */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <View style={{ flexDirection: "row", gap: READER_CARD_GAP }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonItem}>
                <SkeletonLoader
                  width={READER_CARD_SIZE - 8}
                  height={READER_CARD_SIZE - 8}
                  style={{ borderRadius: (READER_CARD_SIZE - 8) / 2 }}
                />
                <SkeletonLoader
                  width={50}
                  height={12}
                  style={{ marginTop: 6, borderRadius: 4 }}
                />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={data?.readers}
          keyExtractor={(item) => item.user.id}
          renderItem={renderReaderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
          }}
          ItemSeparatorComponent={() => <View style={{ width: READER_CARD_GAP }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    marginTop: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonContainer: {
    marginBottom: 8,
  },
  skeletonItem: {
    alignItems: "center",
  },
  readerCard: {
    alignItems: "center",
    width: READER_CARD_SIZE,
  },
  username: {
    marginTop: 6,
    textAlign: "center",
    maxWidth: READER_CARD_SIZE,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  progressText: {
    fontSize: 10,
  },
});

export default React.memo(ReadBySection);
