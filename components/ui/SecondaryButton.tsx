import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SecondaryButton({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  disabled = false,
  icon,
  iconPosition = 'left'
}: ButtonProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.95, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.button, animatedStyle, { backgroundColor: colors.secondaryButton }, style]}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && (
        <View style={styles.iconLeft}>{icon}</View>
      )}
      <Text style={[typography.actionButton, { color: colors.secondaryButtonText }, textStyle]}>
        {title}
      </Text>
      {icon && iconPosition === 'right' && (
        <View style={styles.iconRight}>{icon}</View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
    overflow: 'hidden',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
}); 