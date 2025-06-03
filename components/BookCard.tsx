import React, { useState, useRef, useCallback } from "react";
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
import { CirclePlus, ListPlus, CircleStop , Clock3, BookOpenIcon, BookCheck, Pause, Square } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Book, ReadingStatus } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { useBottomSheet } from "../contexts/BottomSheetContext";
import Toast from "react-native-toast-message";
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import Badge from "./ui/Badge";

interface BookCardProps {
  book: Book;
  onPress?: (book: Book) => void;
  onTrackingToggle?: (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => void;
  size?: 'default' | 'compact';
  showAuthor?: boolean;
  showRating?: boolean;
  showTrackingStatus?: boolean;
  showTrackingButton?: boolean;
  rank?: number;
  currentListId?: number;
  isFromListPage?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;
const COMPACT_CARD_WIDTH = width * 0.29;

const BookCard = ({ book, onPress, onTrackingToggle, size = 'default', showAuthor = true, showRating = true, showTrackingStatus = false, showTrackingButton = true, rank, currentListId, isFromListPage }: BookCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isBookTracked } = useTrackedBooksStore();
  const isTracking = isBookTracked(book.id);
  const { colors } = useTheme();
  const { isBottomSheetVisible, openBookActions } = useBottomSheet();
  const typography = useTypography();

  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: 'À lire', icon: <Clock3 size={12} strokeWidth={2.75} color={colors.planToRead} /> },
    'reading': { text: 'En cours', icon: <BookOpenIcon size={12} strokeWidth={2.75} color={colors.reading} /> },
    'completed': { text: 'Complété', icon: <BookCheck size={12} strokeWidth={2.75} color={colors.completed} /> },
    'on_hold': { text: 'En pause', icon: <Pause size={12} strokeWidth={2.75} color={colors.onHold} /> },
    'dropped': { text: 'Abandonné', icon: <Square size={12} strokeWidth={2.75} color={colors.dropped} /> },
  }

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // Options for the bottom sheet tracking actions
  const bottomSheetTrackingOptions = [
    {
      id: "reading",
      title: "Mettre en cours de lecture",
      icon: CirclePlus,
      action: () => {
        onTrackingToggle?.(book.id.toString(), false, book);
      }
    },
    {
      id: "add-to-list",
      title: "Ajouter à une liste",
      icon: ListPlus,
      action: () => {
        onTrackingToggle?.(book.id.toString(), false, book);
      }
    },
    {
      id: "stopped",
      title: "Mettre en arrêt",
      icon: CircleStop,
      action: () => {
        onTrackingToggle?.(book.id.toString(), true, book);
      }
    },
  ];

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Function to handle quick add/remove tracking
  const handleTrackingToggle = () => {
    onTrackingToggle?.(book.id.toString(), isTracking, book);
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
    if (onPress) {
      onPress(book);
    } else {
      // Default behavior if no onPress is provided
      // Example: Navigate to a detail screen or log
      console.log(`Livre sélectionné: ${book.title}`);
    }
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
          ]}
        >
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: colors.card },
              size === 'compact' && {
                height: COMPACT_CARD_WIDTH * 1.5,
              },
            ]}
          >
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            )}
            <Image
              source={book.cover_image}
              style={[
                styles.mangaCover,
                size === 'compact' && {
                  width: '100%',
                  height: '100%',
                },
              ]}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!isLoading && !hasError && showTrackingButton && (
              <View style={styles.trackButton}>
                <TrackingIconButton 
                  isTracking={isTracking} 
                  onPress={handleTrackingToggle} 
                />
              </View>
            )}
            {/* Chapter badge on cover */}
            {book.tracking_status && book.tracking_status.current_chapter && (
              <View style={styles.chapterBadgeContainer}>
                <Badge
                  text={`Ch. ${book.tracking_status.current_chapter.toString()}`}
                  color={colors.badgeText}
                  backgroundColor={colors.badgeBackground}
                  borderColor={colors.badgeBorder}
                />
              </View>
            )}
            {hasError && (
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
            <Text
              style={[
                styles.mangaTitle,
                typography.h3,
                { color: colors.text },
                size === 'compact' && { fontSize: 13, marginBottom: 2 },
              ]}
              numberOfLines={1}
            >
              {book.title}
            </Text>
            {showAuthor && (
                <Text
                style={[
                  styles.mangaAuthor,
                  typography.caption,
                  { color: colors.secondaryText },
                  size === 'compact' && { fontSize: 12, marginBottom: 2 },
                ]}
                numberOfLines={1}
              >
                {book.author}
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
                  ]}
                >
                  {book.rating || "N/A"}
                </Text>
              </View>
            )}
            {book.tracking_status && showTrackingStatus && (
              <View style={styles.badgeContainer}>
                <Badge
                  text={trackingStatusValues[book.tracking_status.status].text}
                  color={colors.badgeText}
                  backgroundColor={colors.badgeBackground}
                  icon={trackingStatusValues[book.tracking_status.status].icon}
                  borderColor={colors.badgeBorder}
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
    fontSize: 14,
    fontWeight: "bold",
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
