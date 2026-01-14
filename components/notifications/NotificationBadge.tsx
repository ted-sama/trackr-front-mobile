import React from "react";
import { Pressable, View, StyleSheet, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Bell } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { useUnreadCount } from "@/hooks/queries/notifications";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NotificationBadge() {
  const { colors } = useTheme();
  const { data: unreadCount = 0 } = useUnreadCount();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    router.push("/notifications");
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withTiming(0.92, { duration: 220 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
      style={[styles.container, animatedStyle]}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.buttonBg,
          {
            backgroundColor: colors.backButtonBackground,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 1,
          },
        ]}
      />
      <Bell size={22} color={colors.icon} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
    overflow: "hidden",
  },
  buttonBg: {
    borderRadius: 22,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});
