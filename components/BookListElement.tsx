import React, { useCallback, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Book, ReadingStatus } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from '@/state/tracked-books-store';
import Badge from "./ui/Badge";
import { Clock3, BookOpenIcon, BookCheck, Pause, Square, Ellipsis } from "lucide-react-native";
import BookActionsBottomSheet from "./BookActionsBottomSheet";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface BookListElementProps {
  book: Book;
  onPress: () => void;
  onTrackingToggle?: (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => void;
  showTrackingButton?: boolean;
  showTrackingStatus?: boolean;
  showAuthor?: boolean;
}

const BookListElement = ({ book, onPress, onTrackingToggle, showAuthor = true, showTrackingButton = false, showTrackingStatus = false }: BookListElementProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { isBottomSheetVisible, setBottomSheetVisible } = useBottomSheet();
  const { isBookTracked } = useTrackedBooksStore();
  const isTracking = isBookTracked(book.id);
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
  }

  const handleTrackingToggle = () => {
    onTrackingToggle?.(book.id.toString(), isTracking, book);
  };

  // Fonction pour présenter le bottom sheet
  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBottomSheetVisible(true);
    bottomSheetModalRef.current?.present();
  }, []);

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
            <Text style={[styles.title, typography.h3, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{book.title}</Text>
            {book.author && showAuthor && (
              <Text style={[styles.author, typography.caption, { color: colors.secondaryText }]}>{book.author}</Text>
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
        {showTrackingButton && (
          <TrackingIconButton isTracking={isTracking} onPress={handleTrackingToggle} />
        )}
        <Pressable onPress={handlePresentModalPress}>
          <Ellipsis size={22} color={colors.icon} strokeWidth={2} />
        </Pressable>
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
    width: 45,
    height: 68,
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
});
