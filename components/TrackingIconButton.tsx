import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface TrackingIconButtonProps {
  isTracking: boolean;
  onPress?: () => void;
  size?: number; // Allow custom size if needed
}

const TrackingIconButton = ({
  isTracking,
  onPress,
  size = 24, // Default size matching MangaCard
}: TrackingIconButtonProps) => {
  const { colors } = useTheme();

  const iconName = isTracking
    ? "checkmark-circle-outline"
    : "add-circle-outline";
  const backgroundColor = isTracking ? colors.accent : "#16161699"; // Use slightly more opaque grey
  const iconColor = "#FFF";
  const backgroundSize = size * 0.83; // Approx ratio from MangaCard (20/24)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const content = (
    <>
      <View
        style={[
          styles.backgroundCircle,
          {
            backgroundColor: backgroundColor,
            width: backgroundSize,
            height: backgroundSize,
            borderRadius: backgroundSize / 2,
            // Position behind the main icon
            position: 'absolute',
            top: (size - backgroundSize) / 2, // Center the background
            left: (size - backgroundSize) / 2,
          },
        ]}
      />
      <Ionicons name={iconName} size={size} color={iconColor} />
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress} style={[styles.container, { width: size, height: size }]}>
        {content}
      </Pressable>
    );
  }

  return (
      <View style={[styles.container, { width: size, height: size }]}>
        {content}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: 'relative', // Needed for absolute positioning of background
  },
  backgroundCircle: {
    // Styles applied dynamically based on props
  },
});

export default TrackingIconButton; 