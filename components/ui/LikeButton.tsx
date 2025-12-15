import React from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Heart } from "lucide-react-native";

import { useTheme } from "@/contexts/ThemeContext";

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}

export function LikeButton({ isLiked, count, onPress, disabled = false }: LikeButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Heart
          size={14}
          strokeWidth={2}
          color={isLiked ? colors.accent : colors.icon}
          fill={isLiked ? colors.accent : "transparent"}
        />
        <Text
          style={{
            fontSize: 12,
            color: isLiked ? colors.accent : colors.secondaryText,
            fontWeight: "600",
          }}
        >
          {count}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default LikeButton;
