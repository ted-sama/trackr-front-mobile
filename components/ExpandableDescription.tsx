import React, { useState, useCallback } from "react";
import { Text, StyleSheet, View, Pressable, StyleProp, TextStyle, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";

interface ExpandableDescriptionProps {
  text: string;
  initialCollapsedHeight?: number;
  numberOfLines?: number;
  minLengthForExpansion?: number;
  textStyle?: StyleProp<TextStyle>;
  toggleButtonTextStyle?: StyleProp<TextStyle>;
}

const DEFAULT_COLLAPSED_HEIGHT = 70;
const DEFAULT_NUMBER_OF_LINES = 3;
const ANIMATION_DURATION = 250;

export default function ExpandableDescription({
  text,
  initialCollapsedHeight = DEFAULT_COLLAPSED_HEIGHT,
  numberOfLines = DEFAULT_NUMBER_OF_LINES,
  minLengthForExpansion = 150,
  textStyle,
  toggleButtonTextStyle,
}: ExpandableDescriptionProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const animatedHeight = useSharedValue(0);
  const { t } = useTranslation();

  // Check if expandable based on length OR number of line breaks
  const lineBreaks = (text.match(/\n/g) || []).length;
  const potentiallyExpandable = text.length > minLengthForExpansion || lineBreaks >= 2;

  // Measure the full height of the text
  const onFullTextLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setFullHeight(height);
  }, []);

  // Measure the collapsed height
  const onCollapsedTextLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setCollapsedHeight(height);

    // Initialize animated height once we have the collapsed height
    if (animatedHeight.value === 0) {
      animatedHeight.value = height;
    }
  }, [animatedHeight]);

  // Determine if expansion is needed after both heights are measured
  React.useEffect(() => {
    if (fullHeight !== null && collapsedHeight !== null) {
      const shouldExpand = fullHeight > collapsedHeight + 5; // 5px threshold
      setNeedsExpansion(shouldExpand && potentiallyExpandable);
    }
  }, [fullHeight, collapsedHeight, potentiallyExpandable]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    if (animatedHeight.value === 0) {
      return {};
    }
    return {
      height: animatedHeight.value,
      overflow: "hidden",
    };
  });

  const toggleDescription = useCallback(() => {
    if (fullHeight === null || collapsedHeight === null) return;

    const targetHeight = isExpanded ? collapsedHeight : fullHeight;

    animatedHeight.value = withTiming(targetHeight, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    setIsExpanded(!isExpanded);
  }, [isExpanded, fullHeight, collapsedHeight, animatedHeight]);

  // If text is too short, just render it without expansion logic
  if (!potentiallyExpandable) {
    return (
      <View>
        <Text style={[typography.body, { color: colors.text }, textStyle]}>
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Hidden full text for measurement */}
      <View style={styles.hiddenContainer} pointerEvents="none">
        <Text
          style={[typography.body, { color: colors.text }, textStyle]}
          onLayout={onFullTextLayout}
        >
          {text}
        </Text>
      </View>

      {/* Hidden collapsed text for measurement */}
      <View style={styles.hiddenContainer} pointerEvents="none">
        <Text
          style={[typography.body, { color: colors.text }, textStyle]}
          numberOfLines={numberOfLines}
          onLayout={onCollapsedTextLayout}
        >
          {text}
        </Text>
      </View>

      {/* Visible animated container */}
      <Animated.View style={[styles.descriptionContainer, animatedContainerStyle]}>
        <Text
          style={[typography.body, { color: colors.text }, textStyle]}
          numberOfLines={isExpanded ? undefined : numberOfLines}
        >
          {text}
        </Text>

        {/* Fade overlay when collapsed */}
        {!isExpanded && needsExpansion && (
          <LinearGradient
            colors={[
              `${colors.background}00`,
              `${colors.background}99`,
              colors.background,
            ]}
            locations={[0, 0.4, 1]}
            style={styles.fadeOverlay}
            pointerEvents="none"
          />
        )}
      </Animated.View>

      {/* Toggle button */}
      {needsExpansion && (
        <Pressable onPress={toggleDescription} style={styles.toggleButton}>
          <Text
            style={[
              typography.body,
              styles.toggleButtonTextBase,
              { color: colors.accent },
              toggleButtonTextStyle,
            ]}
          >
            {isExpanded ? t("description.collapse") : t("description.readMore")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
  descriptionContainer: {
    position: "relative",
  },
  fadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
  },
  toggleButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  toggleButtonTextBase: {
    textDecorationLine: "underline",
  },
});
