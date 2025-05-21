import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { ReadingList } from "@/types";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface CollectionListElementProps {
  list: ReadingList;
  onPress: () => void;
}

export default function CollectionListElement({ list, onPress }: CollectionListElementProps) {
  const { colors } = useTheme();
  const typography = useTypography();

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

  const styles = StyleSheet.create({
    // container for stacked covers
    coverStackContainer: {
      width: 100, // cover width (60) + offset*2
      height: 90,
      position: 'relative',
    },
    // actual cover image
    coverStackImage: {
      width: 60,
      height: 90,
      borderRadius: 4,
      borderWidth: 0.75,
      position: 'absolute',
      shadowColor: '#000',
      shadowOffset: { width: -3, height: -3 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    // placeholder when no cover
    coverStackPlaceholder: {
      width: 60,
      height: 90,
      borderRadius: 4,
      borderWidth: 0.75,
      position: 'absolute',
      backgroundColor: '#ccc',
      shadowColor: '#000',
      shadowOffset: { width: -3, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, animatedStyle]}>
        <View style={styles.coverStackContainer}>  
          {[0, 1, 2].map((_, index) => {
            const book = list.first_book_covers?.[index];
            const leftOffset = index * 20;
            return book ? (
              <Image
                key={book}
                source={{ uri: book }}
                style={[styles.coverStackImage, { left: leftOffset, zIndex: 3 - index, borderColor: colors.border }]} 
              />
            ) : (
              <View
                key={`placeholder-${index}`}
                style={[styles.coverStackPlaceholder, { left: leftOffset, zIndex: 3 - index, borderColor: colors.border }]} 
              />
            );
          })}
        </View>
        <View style={{ flexDirection: "column", gap: 4 }}>
          <Text style={[typography.h3, { color: colors.text }]}>{list.name}</Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>{list.total_books} éléments</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
