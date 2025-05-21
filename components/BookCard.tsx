import React, { useState, useRef, useCallback } from "react"; // Removed useMemo, act
import {
  View,
  Text,
  Image,
  // TouchableOpacity, // Removed
  // TouchableWithoutFeedback, // Removed
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
// Removed CirclePlus, ListPlus, CircleStop from lucide-react-native
import { Clock3, BookOpenIcon, BookCheck, Pause, Square } from "lucide-react-native"; 
// import CardSheetModal from "./CardSheetModal"; // Removed
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, {
  useAnimatedStyle,
  // interpolate, // Removed
  // Extrapolation, // Removed
  useSharedValue,
  // withSpring, // Removed
  withTiming,
} from "react-native-reanimated";
import { Book, ReadingStatus } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { useBottomSheet } from "../contexts/BottomSheetContext";
// import Toast from "react-native-toast-message"; // Removed
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackingStore } from "../store/trackingStore"; // Adjusted path
import Badge from "./ui/Badge";
import BookActionsBottomSheet from "@/components/BookActionsBottomSheet";

interface BookCardProps {
  book: Book;
  onPress?: (book: Book) => void;
  onTrackingToggle?: (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => void;
  size?: 'default' | 'compact';
  showAuthor?: boolean;
  showRating?: boolean;
  showTrackingStatus?: boolean;
  showTrackingButton?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.33;
const COMPACT_CARD_WIDTH = width * 0.29;

const BookCard = ({ book, onPress, onTrackingToggle, size = 'default', showAuthor = true, showRating = true, showTrackingStatus = false, showTrackingButton = true }: BookCardProps) => {
  const [imageIsLoading, setImageIsLoading] = useState(true); // Renamed to avoid conflict with store's isLoading
  const [hasError, setHasError] = useState(false);
  
  const { 
    isBookTracked, 
    addTrackedBook, 
    removeTrackedBook, 
    isUpdating 
    // updateError // Not directly used for toast here, parent usually handles it
  } = useTrackingStore();

  const isCurrentlyTracked = isBookTracked(book.id);
  const { colors } = useTheme();
  const { isBottomSheetVisible, setBottomSheetVisible } = useBottomSheet();
  const typography = useTypography();

  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: 'À lire', icon: <Clock3 size={12} strokeWidth={2.75} color={colors.planToRead} /> },
    'reading': { text: 'En cours', icon: <BookOpenIcon size={12} strokeWidth={2.75} color={colors.reading} /> },
    'completed': { text: 'Complété', icon: <BookCheck size={12} strokeWidth={2.75} color={colors.completed} /> },
    'on_hold': { text: 'En pause', icon: <Pause size={12} strokeWidth={2.75} color={colors.onHold} /> },
    'dropped': { text: 'Abandonné', icon: <Square size={12} strokeWidth={2.75} color={colors.dropped} /> },
  };

  // Shared value for scale animation
  const scale = useSharedValue(1);

  // Référence au bottom sheet modal
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handleImageLoad = () => {
    setImageIsLoading(false);
  };

  const handleImageError = () => {
    setImageIsLoading(false);
    setHasError(true);
  };

  // Function to handle quick add/remove tracking
  const handleTrackingToggleInternal = async () => {
    if (onTrackingToggle) {
      onTrackingToggle(book.id.toString(), isCurrentlyTracked, book);
    } else {
      try {
        if (isCurrentlyTracked) {
          await removeTrackedBook(book.id);
        } else {
          await addTrackedBook(book);
        }
        // Optional: Show local toast if not handled by parent
        // Toast.show({ type: 'info', text1: isCurrentlyTracked ? 'Retiré' : 'Ajouté' });
      } catch (error) {
        console.error("BookCard: Failed to toggle tracking", error);
        // Toast.show({ type: 'error', text1: 'Erreur de suivi' });
      }
    }
  };

  // Fonction pour présenter le bottom sheet
  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBottomSheetVisible(true);
    scale.value = withTiming(1, { duration: 220 }); // Reset scale if it was pressed
    bottomSheetModalRef.current?.present();
  }, [setBottomSheetVisible, scale]);

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
      console.log(`Livre sélectionné: ${book.title}`);
    }
  };

  return (
    <>
      {/* Bottom Sheet Modal */}
      <BookActionsBottomSheet book={book} ref={bottomSheetModalRef} onDismiss={() => setBottomSheetVisible(false)} backdropDismiss />
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
            {imageIsLoading && ( // Use renamed imageIsLoading
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            )}
            <Image
              source={{ uri: book.cover_image }}
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
            {!imageIsLoading && !hasError && showTrackingButton && (
              <View style={styles.trackButton}>
                <TrackingIconButton 
                  isTracking={isCurrentlyTracked} 
                  isLoading={isUpdating[book.id]} // Use isUpdating from the store
                  onPress={handleTrackingToggleInternal} 
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
