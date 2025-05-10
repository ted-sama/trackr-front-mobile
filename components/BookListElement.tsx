import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Book } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "./TrackingIconButton";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from '@/state/tracked-books-store';
import Badge from "./ui/Badge";

interface BookListElementProps {
  book: Book;
  onPress: () => void;
  onTrackingToggle?: (bookId: string, isCurrentlyTracking: boolean, bookObject?: Book) => void;
  showTrackingButton?: boolean;
  showTrackingStatus?: boolean;
}

const BookListElement = ({ book, onPress, onTrackingToggle, showTrackingButton = false, showTrackingStatus = false }: BookListElementProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { isBookTracked } = useTrackedBooksStore();
  const isTracking = isBookTracked(book.id);

  const handleTrackingToggle = () => {
    onTrackingToggle?.(book.id.toString(), isTracking, book);
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.detailsGroup}>
        <Image source={{ uri: book.cover_image }} style={styles.image} />
        <View style={styles.infoContainer}>
          <Text style={[styles.title, typography.bodyBold, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{book.title}</Text>
          <Text style={[styles.author, typography.caption, { color: colors.secondaryText }]}>{book.author}</Text>
          {book.tracking_status && showTrackingStatus && (
            <Badge
              text={book.tracking_status.status}
              color={colors[book.tracking_status.status]}
              backgroundColor={colors.badgeBackground}
            />
          )}
        </View>
      </View>
      {showTrackingButton && (
        <TrackingIconButton isTracking={isTracking} onPress={handleTrackingToggle} />
      )}
    </Pressable>
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
});
