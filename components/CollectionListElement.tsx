import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { List } from "@/types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface CollectionListElementProps {
  list: List;
  onPress: () => void;
  size?: "default" | "compact";
  isSelected?: boolean;
}

export default function CollectionListElement({
  list,
  onPress,
  size = "default",
  isSelected,
}: CollectionListElementProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  const separator = () => {
    return (
      <Text
        style={{
          fontWeight: "900",
          marginHorizontal: 4,
          color: colors.secondaryText,
        }}
      >
        ·
      </Text>
    );
  };

  // Animation scale
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 220 });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 220 });
  };

  // Define sizes based on size prop
  const isCompact = size === "compact";
  const coverWidth = isCompact ? 40 : 60;
  const coverHeight = isCompact ? 60 : 90;
  const stackOffset = isCompact ? 10 : 20;
  const containerWidth = isCompact ? coverWidth + stackOffset * 2 : 100;
  const containerHeight = isCompact ? coverHeight : 90;
  const mainGap = isCompact ? 8 : 10;
  const textGap = isCompact ? 2 : 4;

  const styles = StyleSheet.create({
    // container for stacked covers
    coverStackContainer: {
      width: containerWidth,
      height: containerHeight,
      position: "relative",
    },
    // actual cover image
    coverStackImage: {
      width: coverWidth,
      height: coverHeight,
      borderRadius: isCompact ? 3 : 4,
      borderWidth: 0.75,
      position: "absolute",
      shadowColor: "#000",
      shadowOffset: { width: -3, height: -3 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    // placeholder when no cover
    coverStackPlaceholder: {
      width: coverWidth,
      height: coverHeight,
      borderRadius: isCompact ? 3 : 4,
      borderWidth: 0.75,
      position: "absolute",
      backgroundColor: "#ccc",
    },
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: mainGap,
            justifyContent: "space-between",
          },
          animatedStyle,
        ]}
      >
        <View style={styles.coverStackContainer}>
          {[0, 1, 2].map((_, index) => {
            const book = list.first_book_covers?.[index];
            const leftOffset = index * stackOffset;
            return book ? (
              <Image
                key={book}
                source={{ uri: book }}
                style={[
                  styles.coverStackImage,
                  {
                    left: leftOffset,
                    zIndex: 3 - index,
                    borderColor: colors.border,
                  },
                ]}
              />
            ) : (
              <View
                key={`placeholder-${index}`}
                style={[
                  styles.coverStackPlaceholder,
                  {
                    left: leftOffset,
                    zIndex: 3 - index,
                    borderColor: colors.border,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: "column", gap: textGap, flex: 1 }}>
          <Text style={[typography.h3, { color: colors.text }]}>
            {list.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[typography.caption, { color: colors.secondaryText }]}>
              {list.total_books} {list.total_books > 1 ? "éléments" : "élément"}
            </Text>
            {size === "compact" && (
              <>
                {separator()}
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
                >
                  {list.is_public ? "Public" : "Privé"}
                </Text>
              </>
            )}
          </View>
          {size === "default" && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={[typography.caption, { color: colors.secondaryText }]}
              >
                Par {list.owner.username}
              </Text>
              {separator()}
              <Text
                style={[typography.caption, { color: colors.secondaryText }]}
              >
                {list.is_public ? "Public" : "Privé"}
              </Text>
            </View>
          )}
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={colors.accent}
            style={{ marginLeft: 8 }}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}
