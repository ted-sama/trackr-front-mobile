import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ActionButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}: ActionButtonProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      opacity.value = withTiming(0.6, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.button, style]}
    >
      <Animated.Text
        style={[
          typography.bodyBold,
          styles.text,
          { color: colors.accent },
          animatedStyle,
          disabled && styles.disabled,
          textStyle,
        ]}
      >
        {title}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    paddingVertical: 12,
  },
  text: {
    textDecorationLine: "underline",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ActionButton;
