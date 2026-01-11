import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserCheck, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface FollowButtonProps {
  isFollowing: boolean;
  isFriend?: boolean;
  onPress: () => void;
  loading?: boolean;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FollowButton({
  isFollowing,
  isFriend = false,
  onPress,
  loading = false,
  size = 'medium',
  style,
}: FollowButtonProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!loading) {
      scale.value = withTiming(0.95, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!loading) {
      scale.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    if (!loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const isSmall = size === 'small';
  const iconSize = isSmall ? 14 : 16;

  const getButtonStyle = () => {
    if (isFollowing) {
      return {
        backgroundColor: colors.secondaryButton,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    return {
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accent,
    };
  };

  const getTextColor = () => {
    if (isFollowing) {
      return colors.secondaryButtonText;
    }
    return colors.buttonText;
  };

  const getLabel = () => {
    if (isFriend) {
      return t('profile.friends');
    }
    if (isFollowing) {
      return t('profile.following');
    }
    return t('profile.follow');
  };

  const getIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getTextColor()} />;
    }
    if (isFriend) {
      return <Users size={iconSize} color={getTextColor()} />;
    }
    if (isFollowing) {
      return <UserCheck size={iconSize} color={getTextColor()} />;
    }
    return <UserPlus size={iconSize} color={getTextColor()} />;
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={loading}
      style={[
        styles.button,
        isSmall ? styles.buttonSmall : styles.buttonMedium,
        getButtonStyle(),
        animatedStyle,
        style,
      ]}
    >
      {getIcon()}
      <Text
        style={[
          isSmall ? typography.caption : typography.body,
          { color: getTextColor(), marginLeft: 6, fontWeight: '600' },
        ]}
      >
        {getLabel()}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
  },
  buttonMedium: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
  },
});
