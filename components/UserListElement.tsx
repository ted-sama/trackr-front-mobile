import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { User } from "@/types/user";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const DEFAULT_AVATAR = require("@/assets/images/user/default.png");

interface UserListElementProps {
  user: User;
  onPress?: () => void;
}

const UserListElement = ({ user, onPress }: UserListElementProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={onPress ?? (() => {})}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 220 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
        style={styles.container}
      >
        <View style={styles.detailsGroup}>
          <Image
            source={user.avatar ? { uri: user.avatar } : DEFAULT_AVATAR}
            style={styles.avatar}
          />
          <View style={styles.infoContainer}>
            <Text style={[styles.displayName, typography.h3, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {user.displayName || user.username}
            </Text>
            <Text style={[styles.username, typography.caption, { color: colors.secondaryText }]} numberOfLines={1} ellipsizeMode="tail">
              {user.username}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default UserListElement;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
  },
  detailsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  infoContainer: {
    marginHorizontal: 16,
    flexShrink: 1,
  },
  displayName: {
    marginBottom: 2,
  },
  username: {
    marginBottom: 0,
  },
});
