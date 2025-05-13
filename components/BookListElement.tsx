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

  const trackingStatusValues: Record<ReadingStatus, { text: string, bgColor: string, textColor: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: 'À lire', bgColor: colors.readingStatusBadgeBackground, textColor: colors.badgeText, icon: <Clock3 size={12} color={colors.badgeText} /> },
    'reading': { text: 'En cours', bgColor: colors.readingStatusBadgeBackground, textColor: colors.badgeText, icon: <BookOpenIcon size={12} color={colors.badgeText} /> },
    'completed': { text: 'Complété', bgColor: colors.readingStatusBadgeBackground, textColor: colors.badgeText, icon: <BookCheck size={12} color={colors.badgeText} /> },
    'on_hold': { text: 'En pause', bgColor: colors.readingStatusBadgeBackground, textColor: colors.badgeText, icon: <Pause size={12} color={colors.badgeText} /> },
    'dropped': { text: 'Abandonné', bgColor: colors.readingStatusBadgeBackground, textColor: colors.badgeText, icon: <Square size={12} color={colors.badgeText} /> },
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
      <Pressable onPress={onPress} style={styles.container}>
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
                color={trackingStatusValues[book.tracking_status.status].textColor}
                backgroundColor={trackingStatusValues[book.tracking_status.status].bgColor}
                icon={trackingStatusValues[book.tracking_status.status].icon}
              />
              {book.tracking_status.current_chapter && (
                <Badge
                  text={`Ch. ${book.tracking_status.current_chapter.toString()}`}
                  color={colors.badgeText}
                  backgroundColor={trackingStatusValues[book.tracking_status.status].bgColor}
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
