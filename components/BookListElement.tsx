import React, { useCallback, useRef } from "react";
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
import { Clock3, BookOpenIcon, BookCheck, Pause, Square, Ellipsis } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";
import Transition from "react-native-screen-transitions";

interface BookListElementProps {
  book: Book;
  onPress?: () => void;
  onTrackingToggle?: (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => void;
  showTrackingButton?: boolean;
  showTrackingStatus?: boolean;
  showAuthor?: boolean;
  showRating?: boolean;
  rank?: number;
  currentListId?: string;
  isFromListPage?: boolean;
  compact?: boolean;
}

const BookListElement = ({ book, onPress, onTrackingToggle, showAuthor = true, showRating = false, showTrackingButton = false, showTrackingStatus = false, rank, currentListId, isFromListPage, compact = false }: BookListElementProps) => {
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

  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: 'À lire', icon: <Clock3 size={12} strokeWidth={2.75} color={colors.planToRead} />},
    'reading': { text: 'En cours', icon: <BookOpenIcon size={12} strokeWidth={2.75} color={colors.reading}/>},
    'completed': { text: 'Complété', icon: <BookCheck size={12} strokeWidth={2.75} color={colors.completed} />},
    'on_hold': { text: 'En pause', icon: <Pause size={12} strokeWidth={2.75} color={colors.onHold} />},
    'dropped': { text: 'Abandonné', icon: <Square size={12} strokeWidth={2.75} color={colors.dropped} />},
  }

  const handleTrackingToggle = () => {
    onTrackingToggle?.(book.id.toString(), isTracking, book);
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
            <Transition.View sharedBoundTag={`bookCover-${book.id}`} style={[styles.image, compact && styles.imageCompact]}>
              <Image source={book.coverImage} style={[styles.image, compact && styles.imageCompact]} />
            </Transition.View>
          <View style={[styles.infoContainer, compact && styles.infoContainerCompact]}>
            {rank && (
              <Text style={[typography.caption, { color: colors.secondaryText, marginBottom: compact ? 2 : 4 }]}>
                {rank}
              </Text>
            )}
            <Text style={[styles.title, typography.h3, { color: colors.text, marginBottom: compact ? 2 : 4 }]} numberOfLines={2} ellipsizeMode="tail">{book.title}</Text>
            {book.author && showAuthor && (
              <Text style={[styles.author, typography.caption, { color: colors.secondaryText, marginBottom: compact ? 1 : 2 }]} numberOfLines={1} ellipsizeMode="tail">{book.author}</Text>
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
                {trackingStatus.currentChapter && (
                  <Badge
                    text={`Ch. ${trackingStatus.currentChapter.toString()}`}
                    color={colors.badgeText}
                    backgroundColor={colors.badgeBackground}
                    borderColor={colors.badgeBorder}
                  />
                )}
              </View>
            )}
          </View>
        </View>
        <View style={[styles.actionsContainer, compact && styles.actionsContainerCompact]}>
          {showTrackingButton && (
            <TrackingIconButton isTracking={isTracking} onPress={handleTrackingToggle} />
          )}
          {compact && showTrackingStatus && trackingStatus && trackingStatus.currentChapter && (
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
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionsContainerCompact: {
    gap: 5,
  },
});
