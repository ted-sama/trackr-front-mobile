import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Book } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import TrackingIconButton from "./TrackingIconButton";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { useTypography } from "@/hooks/useTypography";

interface BookListElementProps {
  book: Book;
  onPress: () => void;
}

const BookListElement = ({ book, onPress }: BookListElementProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const [isTracking, setIsTracking] = useState(book.tracking ?? false);

   // Function to handle quick add/remove tracking
   const handleTrackingToggle = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTracking((prevTracking: boolean) => !prevTracking);
    // Show toast message
    Toast.show({
      type: "info",
      text1: isTracking ? "Livre retiré du suivi" : "Livre ajouté au suivi",
    });
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.detailsGroup}>
        <Image source={{ uri: book.cover_image }} style={styles.image} />
        <View style={styles.infoContainer}>
          <Text style={[styles.title, typography.bodyBold, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{book.title}</Text>
          <Text style={[styles.author, typography.caption, { color: colors.secondaryText }]}>{book.author}</Text>
        </View>
      </View>
      {book.tracking && (
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
    paddingVertical: 8,
    paddingHorizontal: 16,
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
