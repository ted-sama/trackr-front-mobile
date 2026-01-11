import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface FollowStatsProps {
  userId: string;
  username: string;
  followersCount: number;
  followingCount: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StatItemProps {
  count: number;
  label: string;
  onPress: () => void;
}

function StatItem({ count, label, onPress }: StatItemProps) {
  const { colors } = useTheme();
  const typography = useTypography();
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

  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.statItem, animatedStyle]}
    >
      <Text style={[typography.title, { color: colors.text }]}>
        {formatCount(count)}
      </Text>
      <Text style={[typography.caption, { color: colors.secondaryText }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function FollowStats({
  userId,
  username,
  followersCount,
  followingCount,
}: FollowStatsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleFollowersPress = () => {
    router.push({
      pathname: '/profile/[userId]/followers',
      params: { userId: username, username },
    });
  };

  const handleFollowingPress = () => {
    router.push({
      pathname: '/profile/[userId]/following',
      params: { userId: username, username },
    });
  };

  return (
    <View style={styles.container}>
      <StatItem
        count={followersCount}
        label={t('profile.followers')}
        onPress={handleFollowersPress}
      />
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      <StatItem
        count={followingCount}
        label={t('profile.following')}
        onPress={handleFollowingPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  separator: {
    width: 1,
    height: 32,
  },
});
