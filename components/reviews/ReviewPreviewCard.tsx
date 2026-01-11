import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";

import { BookReview } from "@/types/review";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";

interface ReviewPreviewCardProps {
  review: BookReview;
  onPress?: () => void;
}

/**
 * Compact review card for displaying in lists
 * Shows book cover, title, rating, and review excerpt
 */
export default function ReviewPreviewCard({
  review,
  onPress,
}: ReviewPreviewCardProps) {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (review.book) {
      router.push(`/book/${review.bookId}/reviews`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.container,
          { flexDirection: "row", gap: 12 },
          animatedStyle,
        ]}
      >
        {/* Book Cover */}
        {review.book?.coverImage ? (
          <Image
            source={{ uri: review.book.coverImage }}
            style={[
              styles.coverImage,
              { borderColor: colors.border },
            ]}
          />
        ) : (
          <View
            style={[
              styles.coverImage,
              styles.coverPlaceholder,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          />
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Book Title */}
          <Text
            style={[typography.h3, { color: colors.text }]}
            numberOfLines={1}
          >
            {review.book?.title || "Unknown book"}
          </Text>

          {/* Rating Stars */}
          {review.rating !== null && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= review.rating! ? "star" : "star-outline"}
                  size={14}
                  color={colors.secondaryText}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
          )}

          {/* Review Excerpt */}
          <Text
            style={[
              typography.body,
              { color: colors.secondaryText, marginTop: 4 },
            ]}
            numberOfLines={2}
          >
            {review.content}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    borderWidth: 0.75,
  },
  coverPlaceholder: {
    backgroundColor: "#ccc",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
