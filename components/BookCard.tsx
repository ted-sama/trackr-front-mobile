import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Clock3, BookOpenIcon, BookCheck, Pause, Square } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Book } from "@/types/book";
import { ReadingStatus } from "@/types/reading-status";
import { useTheme } from "../contexts/ThemeContext";
import { useBottomSheet } from "../contexts/BottomSheetContext";
import { toast } from "sonner-native";
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import Badge from "./ui/Badge";
import StarRating from "./ui/StarRating";

interface BookCardProps {
  book: Book;
  onPress?: (book: Book) => void;
  size?: 'default' | 'compact' | 'compact-small' | 'compact-xs';
  showTitle?: boolean;
  showAuthor?: boolean;
  showRating?: boolean;
  showUserRating?: boolean;
  showTrackingStatus?: boolean;
  showTrackingButton?: boolean;
  showTrackingChapter?: boolean;
  rank?: number;
  currentListId?: string;
  isFromListPage?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;
const COMPACT_CARD_WIDTH = width * 0.29;
const COMPACT_SMALL_CARD_WIDTH = width * 0.25;
// Calculate width for 5 items per row with FlatList numColumns
// FlatList handles the layout, so we calculate based on available width after padding
// Available width = screen width - ScrollView padding (32px) - StatsSection padding (32px) = width - 64
// Each item width = (available width - total gaps) / 5 = (width - 64 - 32) / 5 (4 gaps of 8px each = 32px)
const COMPACT_XS_CARD_WIDTH = (width - 64 - 32) / 5;

const DEFAULT_COVER_COLOR = '#6B7280'; // Grey color for missing covers

const BookCard = ({ book, onPress, size = 'default', showTitle = true, showAuthor = true, showRating = true, showUserRating = false, showTrackingStatus = false, showTrackingButton = true, showTrackingChapter = false, rank, currentListId, isFromListPage }: BookCardProps) => {
  const hasCover = Boolean(book.coverImage);
  const [isLoading, setIsLoading] = useState(hasCover);
  const [hasError, setHasError] = useState(false);
  const { isBookTracked, getTrackedBookStatus } = useTrackedBooksStore();
  const isTracking = isBookTracked(book.id);
  const trackingStatus = getTrackedBookStatus(book.id);
  const { colors } = useTheme();
  const { isBottomSheetVisible, openBookActions } = useBottomSheet();
  const typography = useTypography();
  const { t } = useTranslation();
  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: t('status.planToRead'), icon: <Clock3 size={12} strokeWidth={2.75} color={colors.planToRead} /> },
    'reading': { text: t('status.reading'), icon: <BookOpenIcon size={12} strokeWidth={2.75} color={colors.reading} /> },
    'completed': { text: t('status.completed'), icon: <BookCheck size={12} strokeWidth={2.75} color={colors.completed} /> },
    'on_hold': { text: t('status.onHold'), icon: <Pause size={12} strokeWidth={2.75} color={colors.onHold} /> },
    'dropped': { text: t('status.dropped'), icon: <Square size={12} strokeWidth={2.75} color={colors.dropped} /> },
  }

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // No local bottom sheet options here; actions are managed by BottomSheetContext

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Function to handle quick add/remove tracking
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
    scale.value = withTiming(1, { duration: 220 });
    openBookActions(book, 'actions', currentListId, isFromListPage);
  }, [book, openBookActions, currentListId, isFromListPage, scale]);

  // Create animated style for scale animation
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    onPress?.(book);
  };

  return (
    <>
      {/* Manga Card */}
      <Pressable
        disabled={isBottomSheetVisible}
        onPressIn={() => {
          isBottomSheetVisible
            ? null
            : scale.value = withTiming(0.98, { duration: 220 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 220 });
        }}
        onPress={handlePress}
        onLongPress={handlePresentModalPress}
      >
        <Animated.View
          style={[
            styles.mangaCard,
            animatedCardStyle,
            size === 'compact' && {
              width: COMPACT_CARD_WIDTH,
            },
            size === 'compact-small' && {
              width: COMPACT_SMALL_CARD_WIDTH,
            },
            size === 'compact-xs' && {
              width: COMPACT_XS_CARD_WIDTH,
            },
          ]}
        >
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: colors.card },
              size === 'compact' && {
                height: COMPACT_CARD_WIDTH * 1.5,
              },
              size === 'compact-small' && {
                height: COMPACT_SMALL_CARD_WIDTH * 1.5,
              },
              size === 'compact-xs' && {
                height: COMPACT_XS_CARD_WIDTH * 1.5,
              },
            ]}
          >
            {isLoading && hasCover && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            )}
            {hasCover ? (
              <Image
                source={{ uri: book.coverImage }}
                style={[
                  styles.mangaCover,
                  size === 'compact' && {
                    width: '100%',
                    height: '100%',
                  },
                  size === 'compact-small' && {
                    width: '100%',
                    height: '100%',
                  },
                  size === 'compact-xs' && {
                    width: '100%',
                    height: '100%',
                  },
                ]}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <View
                style={[
                  styles.noCoverContainer,
                  { backgroundColor: DEFAULT_COVER_COLOR },
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={size === 'compact-xs' ? 20 : size === 'compact-small' ? 24 : 32}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
            )}
            {!isLoading && !hasError && showTrackingButton && (
              <View style={styles.trackButton}>
                <TrackingIconButton 
                  isTracking={isTracking} 
                  onPress={handleTrackingToggle} 
                />
              </View>
            )}
            {/* Chapter badge on cover */}
            { showTrackingChapter && trackingStatus && trackingStatus.status !== 'completed' && trackingStatus.currentChapter && (
              <View style={styles.chapterBadgeContainer}>
                <Badge
                  text={`#${trackingStatus.currentChapter.toString()}`}
                  color={colors.badgeText}
                  backgroundColor={colors.badgeBackground}
                  borderColor={colors.badgeBorder}
                />
              </View>
            )}
            {hasError && hasCover && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.card },
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={colors.border}
                />
                <Text style={[styles.errorText, { color: colors.border }]}> 
                  Image non disponible
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.mangaInfo, size === 'compact' && { paddingTop: 4 }]}> 
            {rank && (
              <Text style={[typography.caption, { color: colors.secondaryText, marginBottom: 4 }]}>
                {rank}
              </Text>
            )}
            {showTitle && (
            <Text
              style={[
                styles.mangaTitle,
                typography.h3,
                { color: colors.text },
                size === 'compact' && { fontSize: 13, marginBottom: 2 },
                size === 'compact-small' && { fontSize: 12, marginBottom: 2 },
                size === 'compact-xs' && { fontSize: 11, marginBottom: 2 },
              ]}
              numberOfLines={1}
            >
                {book.title}
              </Text>
            )}
            {showAuthor && (
                <Text
                style={[
                  styles.mangaAuthor,
                  typography.caption,
                  { color: colors.secondaryText },
                  size === 'compact' && { fontSize: 12, marginBottom: 2 },
                  size === 'compact-small' && { fontSize: 11, marginBottom: 2 },
                  size === 'compact-xs' && { fontSize: 10, marginBottom: 2 },
                ]}
                numberOfLines={1}
              >
                {book.type === 'comic'
                  ? book.publishers?.map((pub) => pub.name).join(", ")
                  : book.authors?.map((author) => author.name).join(", ")
                }
              </Text>
            )}
            {showRating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={colors.secondaryText} />
                <Text
                  style={[
                    styles.ratingText,
                    typography.caption,
                    { color: colors.secondaryText },
                    size === 'compact-small' && { fontSize: 11 },
                    size === 'compact-xs' && { fontSize: 10 },
                  ]}
                >
                  {book.rating || "N/A"}
                </Text>
              </View>
            )}
            {trackingStatus && showTrackingStatus && (
              <View style={styles.badgeContainer}>
                <Badge
                  text={trackingStatusValues[trackingStatus.status as ReadingStatus].text}
                  color={colors.badgeText}
                  backgroundColor={colors.badgeBackground}
                  icon={trackingStatusValues[trackingStatus.status as ReadingStatus].icon}
                  borderColor={colors.badgeBorder}
                />
              </View>
            )}
            {showUserRating && trackingStatus?.rating && (
              <View style={styles.userRatingContainer}>
                <StarRating
                  rating={trackingStatus.rating}
                  size={size === 'compact-xs' ? 9 : size === 'compact-small' ? 10 : 12}
                  color={colors.secondaryText}
                />
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  mangaCard: {
    width: CARD_WIDTH,
    overflow: "hidden",
  },
  bottomSheetContent: {
    padding: 16,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    gap: 10,
  },
  bottomSheetActions: {
    flexDirection: "column",
    gap: 10,
    marginTop: 16,
  },
  bottomSheetActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.5,
    borderRadius: 6,
    position: "relative",
  },
  mangaCover: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  noCoverContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  trackButton: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  mangaInfo: {
    paddingTop: 8,
  },
  mangaTitle: {
    marginBottom: 2,
  },
  mangaAuthor: {
    fontSize: 12,
    marginBottom: 2,
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
  badgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  chapterBadgeContainer: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    zIndex: 2,
  },
});

export default React.memo(BookCard);
