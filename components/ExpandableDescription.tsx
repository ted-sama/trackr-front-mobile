import React, { useState } from "react";
import { Text, StyleSheet, View, Pressable, StyleProp, TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext"; // Assuming useTheme provides colors
import { useTypography } from "@/hooks/useTypography"; // Assuming useTypography provides typography styles

interface ExpandableDescriptionProps {
  text: string;
  initialCollapsedHeight?: number;
  textStyle?: StyleProp<TextStyle>;
  toggleButtonTextStyle?: StyleProp<TextStyle>;
  readMoreText?: string;
  collapseText?: string;
}

const DEFAULT_COLLAPSED_HEIGHT = 60; // Default height for ~3 lines
const EXPANDED_HEIGHT_PLACEHOLDER = 1000; // A large enough value for any description size
const ANIMATION_DURATION = 300; // ms

export default function ExpandableDescription({
  text,
  initialCollapsedHeight = DEFAULT_COLLAPSED_HEIGHT,
  textStyle,
  toggleButtonTextStyle,
  readMoreText = "Lire la suite",
  collapseText = "Réduire",
}: ExpandableDescriptionProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionMaxHeight = useSharedValue(initialCollapsedHeight);

  const expandable = text.length > 200

  const animatedDescriptionStyle = useAnimatedStyle(() => {
    return {
      maxHeight: descriptionMaxHeight.value,
      overflow: "hidden",
    };
  });

  const toggleDescription = () => {
    const targetHeight = isExpanded
      ? initialCollapsedHeight
      : EXPANDED_HEIGHT_PLACEHOLDER; // Use a placeholder for expanded height
    descriptionMaxHeight.value = withTiming(targetHeight, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
    setIsExpanded(!isExpanded);
  };

  return (
    <View>
      <Animated.View style={[styles.descriptionContainer, animatedDescriptionStyle]}>
        <Text style={[typography.body, { color: colors.text }, textStyle]}>
          {text}
        </Text>
        {!isExpanded && expandable && (
          <LinearGradient
            colors={[
              `${colors.background}00`, // Transparent
              `${colors.background}B3`, // Semi-transparent
              colors.background,       // Opaque
            ]}
            locations={[0, 0.5, 1]}
            style={styles.fadeOverlay}
            pointerEvents="none"
          />
        )}
      </Animated.View>
      {expandable && (
        <Pressable onPress={toggleDescription} style={styles.toggleButton}>
        <Text
          style={[
            typography.body,
            styles.toggleButtonTextBase,
            { color: colors.accent },
            toggleButtonTextStyle,
          ]}
        >
          {isExpanded ? collapseText : readMoreText}
        </Text>
      </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  descriptionContainer: {
    marginTop: 16,
    position: "relative",
  },
  fadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 30, // Height of the fade effect
  },
  toggleButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  toggleButtonTextBase: {
    textDecorationLine: "underline",
  },
});
