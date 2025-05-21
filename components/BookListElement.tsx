import React, { useCallback, useRef } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Book, ReadingStatus } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackingStore } from "../store/trackingStore"; // Adjusted path
import Badge from "./ui/Badge";
import { Clock3, BookOpenIcon, BookCheck, Pause, Square, Ellipsis } from "lucide-react-native";
import BookActionsBottomSheet from "./BookActionsBottomSheet";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";

interface BookListElementProps {
  book: Book;
  onPress: () => void;
  onTrackingToggle?: (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => void;
  showTrackingButton?: boolean;
  showTrackingStatus?: boolean;
  showAuthor?: boolean;
  showRating?: boolean;
}

const BookListElement = ({ book, onPress, onTrackingToggle, showAuthor = true, showRating = false, showTrackingButton = false, showTrackingStatus = false }: BookListElementProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { setBottomSheetVisible } = useBottomSheet(); // isBottomSheetVisible might not be needed here
  
  const { 
    isBookTracked, 
    addTrackedBook, 
    removeTrackedBook, 
    isUpdating, 
    // updateError // Not directly used for toast here, onTrackingToggle handles it
  } = useTrackingStore();

  const isCurrentlyTracked = isBookTracked(book.id);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
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
  };

  const handleTrackingToggleInternal = async () => {
    // If onTrackingToggle is provided, it means the parent component (e.g., Discover screen)
    // wants to handle the logic, perhaps with different Toast messages or side effects.
    if (onTrackingToggle) {
      onTrackingToggle(book.id.toString(), isCurrentlyTracked, book);
    } else {
      // Default behavior: use the store actions directly
      // Toast messages will be handled by the screen that uses this component,
      // or could be added here if a global Toast is desired for all BookListElement instances.
      try {
        if (isCurrentlyTracked) {
          await removeTrackedBook(book.id);
        } else {
          await addTrackedBook(book);
        }
      } catch (error) {
        // Error is handled in the store and potentially by parent component
        console.error("BookListElement: Failed to toggle tracking", error);
      }
    }
  };

  // Fonction pour présenter le bottom sheet
  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBottomSheetVisible(true);
    bottomSheetModalRef.current?.present();
  }, [setBottomSheetVisible]);

  return (
    <>
      {/* Bottom Sheet Modal */}
      <BookActionsBottomSheet book={book} ref={bottomSheetModalRef} onDismiss={() => setBottomSheetVisible(false)} backdropDismiss />
      <Animated.View style={[animatedStyle]}> 
        <Pressable
          onPress={onPress}
          onPressIn={() => { scale.value = withTiming(0.97, { duration: 220 }); }}
          onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
          style={styles.container}
        >
          <View style={styles.detailsGroup}>
            <Image source={{ uri: book.cover_image }} style={styles.image} />
          <View style={styles.infoContainer}>
            <Text style={[styles.title, typography.h3, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{book.title}</Text>
            {book.author && showAuthor && (
              <Text style={[styles.author, typography.caption, { color: colors.secondaryText }]} numberOfLines={1} ellipsizeMode="tail">{book.author}</Text>
            )}
            {book.rating && showRating && (
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
                {book.tracking_status.current_chapter && (
                  <Badge
                    text={`Ch. ${book.tracking_status.current_chapter.toString()}`}
                    color={colors.badgeText}
                    backgroundColor={colors.badgeBackground}
                    borderColor={colors.badgeBorder}
                  />
                )}
              </View>
            )}
          </View>
        </View>
        <View style={styles.actionsContainer}>
          {showTrackingButton && (
            <TrackingIconButton 
              isTracking={isCurrentlyTracked} 
              isLoading={isUpdating[book.id]} // Pass loading state for this specific book
              onPress={handleTrackingToggleInternal} 
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
  infoContainer: {
    marginHorizontal: 16,
    flexShrink: 1,
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
});
