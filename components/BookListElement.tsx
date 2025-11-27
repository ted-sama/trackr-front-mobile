import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import * as Haptics from "expo-haptics";
import { Book } from "@/types/book";
import { ReadingStatus } from "@/types/reading-status";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import Badge from "./ui/Badge";
import StarRating from "./ui/StarRating";
import { Clock3, BookOpenIcon, BookCheck, Pause, Square, Ellipsis } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";

interface BookListElementProps {
  book: Book;
  onPress?: () => void;
  showTrackingButton?: boolean;
  showTrackingStatus?: boolean;
  showBookType?: boolean;
  showAuthor?: boolean;
  showRating?: boolean;
  showUserRating?: boolean;
  showTrackingChapter?: boolean;
  rank?: number;
  currentListId?: string;
  isFromListPage?: boolean;
  compact?: boolean;
}

const BookListElement = ({ book, onPress, showAuthor = true, showRating = false, showUserRating = false, showTrackingButton = false, showTrackingStatus = false, showTrackingChapter = false, showBookType = false, rank, currentListId, isFromListPage, compact = false }: BookListElementProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { isBottomSheetVisible, openBookActions } = useBottomSheet();
  const { isBookTracked, getTrackedBookStatus } = useTrackedBooksStore();
  const isTracking = isBookTracked(book.id);
  const trackingStatus = getTrackedBookStatus(book.id);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const { t } = useTranslation();
  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: t('status.planToRead'), icon: <Clock3 size={12} strokeWidth={2.75} color={colors.planToRead} />},
    'reading': { text: t('status.reading'), icon: <BookOpenIcon size={12} strokeWidth={2.75} color={colors.reading}/>},
    'completed': { text: t('status.completed'), icon: <BookCheck size={12} strokeWidth={2.75} color={colors.completed} />},
    'on_hold': { text: t('status.onHold'), icon: <Pause size={12} strokeWidth={2.75} color={colors.onHold} />},
    'dropped': { text: t('status.dropped'), icon: <Square size={12} strokeWidth={2.75} color={colors.dropped} />},
  }

  const handleTrackingToggle = async () => {
    try {
      if (isTracking) {
        await useTrackedBooksStore.getState().removeTrackedBook(book.id.toString());
        toast(t('toast.removedFromTracking'));
      } else {
        await useTrackedBooksStore.getState().addTrackedBook(book);
        toast(t('toast.addedToTracking'));
      }
    } catch (err) {
      toast.error(t('toast.errorTrackingToggle'));
    }
  };

  // Présenter le bottom sheet via context
  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openBookActions(book, 'actions', currentListId, isFromListPage);
  }, [book, openBookActions, currentListId, isFromListPage]);

  return (
    <>
      <Animated.View style={[animatedStyle]}> 
        <Pressable
          onPress={onPress ?? (() => {})}
          onPressIn={() => { scale.value = withTiming(0.97, { duration: 220 }); }}
          onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
          style={styles.container}
        >
          <View style={styles.detailsGroup}>
            <Image source={{ uri: book.coverImage }} style={[styles.image, compact && styles.imageCompact]} />
          <View style={[styles.infoContainer, compact && styles.infoContainerCompact]}>
            {rank && (
              <Text style={[typography.caption, { color: colors.secondaryText, marginBottom: compact ? 2 : 4 }]}>
                {rank}
              </Text>
            )}
            <Text style={[styles.title, typography.h3, { color: colors.text, marginBottom: compact ? 2 : 4 }]} numberOfLines={2} ellipsizeMode="tail">{book.title}</Text>
            {book.authors && showAuthor && (
              <Text style={[styles.author, typography.caption, { color: colors.secondaryText, marginBottom: compact ? 1 : 2 }]} numberOfLines={1} ellipsizeMode="tail">{book.authors?.map((author) => author.name).join(", ")}</Text>
            )}
            {showBookType && (
              <Text style={[styles.bookType, typography.caption, { color: colors.secondaryText, marginBottom: compact ? 1 : 2 }]} numberOfLines={1} ellipsizeMode="tail">{t("common.bookTypes." + book.type)}</Text>
            )}
            {showRating && (
              <View style={styles.ratingContainer}>
              <Ionicons name="star" size={compact ? 10 : 12} color={colors.secondaryText} />
              <Text
                style={[
                  styles.ratingText,
                  typography.caption,
                  { color: colors.secondaryText },
                ]}
              >
                {book.rating || "N/A"}
              </Text>
            </View>
            )}
            {trackingStatus && showTrackingStatus && !compact && (
              <View style={[styles.badgeContainer, compact && styles.badgeContainerCompact]}>
                <Badge
                  text={trackingStatusValues[trackingStatus.status as ReadingStatus].text}
                  color={colors.badgeText}
                  backgroundColor={colors.badgeBackground}
                  icon={trackingStatusValues[trackingStatus.status as ReadingStatus].icon}
                  borderColor={colors.badgeBorder}
                />
                {showTrackingChapter && trackingStatus.status !== 'completed' && trackingStatus.currentChapter && (
                  <Badge
                    text={`Ch. ${trackingStatus.currentChapter.toString()}`}
                    color={colors.badgeText}
                    backgroundColor={colors.badgeBackground}
                    borderColor={colors.badgeBorder}
                  />
                )}
              </View>
            )}
            {showUserRating && trackingStatus?.rating && (
              <View style={styles.userRatingContainer}>
                <StarRating
                  rating={trackingStatus.rating}
                  size={compact ? 10 : 12}
                  color={colors.secondaryText}
                />
              </View>
            )}
          </View>
        </View>
        <View style={[styles.actionsContainer, compact && styles.actionsContainerCompact]}>
          {showTrackingButton && (
            <TrackingIconButton isTracking={isTracking} onPress={handleTrackingToggle} />
          )}
          {compact && showTrackingChapter && trackingStatus && trackingStatus.status !== 'completed' && trackingStatus.currentChapter && (
            <Badge
              text={`Ch. ${trackingStatus.currentChapter.toString()}`}
              color={colors.badgeText}
              backgroundColor={colors.badgeBackground}
              borderColor={colors.badgeBorder}
            />
          )}
          <Pressable onPress={handlePresentModalPress}>
            <Ellipsis size={22} color={colors.icon} strokeWidth={2} />
          </Pressable>
        </View>
        </Pressable>
      </Animated.View>
    </>
  );
};

export default BookListElement;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
  },
  detailsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  image: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  imageCompact: {
    width: 40,
    height: 60,
  },
  infoContainer: {
    marginHorizontal: 16,
    flexShrink: 1,
  },
  infoContainerCompact: {
    marginHorizontal: 8,
  },
  title: {
    marginBottom: 4,
  },
  author: {
    marginBottom: 2,
  },
  bookType: {
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeContainerCompact: {
    gap: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  userRatingContainer: {
    marginTop: 6,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionsContainerCompact: {
    gap: 5,
  },
});
