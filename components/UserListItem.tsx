import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import Avatar from '@/components/ui/Avatar';
import FollowButton from '@/components/ui/FollowButton';
import { User } from '@/types/user';
import { useUserStore } from '@/stores/userStore';

interface UserListItemProps {
  user: User & { isFollowedByMe?: boolean; isFriend?: boolean };
  onPress: () => void;
  showFollowButton?: boolean;
  onFollowPress?: () => void;
  followLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function UserListItem({
  user,
  onPress,
  showFollowButton = true,
  onFollowPress,
  followLoading = false,
}: UserListItemProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { currentUser } = useUserStore();
  const scale = useSharedValue(1);

  const isMe = currentUser?.id === user.id;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <Avatar image={user.avatar} size={48} />
      <View style={styles.info}>
        <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
          {user.displayName || user.username}
        </Text>
        <Text style={[typography.caption, { color: colors.secondaryText }]} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
      {showFollowButton && !isMe && onFollowPress && (
        <FollowButton
          isFollowing={user.isFollowedByMe ?? false}
          isFriend={user.isFriend}
          onPress={onFollowPress}
          loading={followLoading}
          size="small"
        />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
});
