import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { Search } from 'lucide-react-native';

interface ImportLoadingStateProps {
  title: string;
  subtitle?: string;
}

export function ImportLoadingState({
  title,
  subtitle,
}: ImportLoadingStateProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  // Icon pulse animation
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.accent + '15' },
          iconAnimatedStyle,
        ]}
      >
        <Search size={32} color={colors.accent} />
      </Animated.View>

      <Text style={[typography.h3, { color: colors.text, marginBottom: subtitle ? 8 : 20, textAlign: 'center' }]}>
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            typography.body,
            { color: colors.secondaryText, textAlign: 'center', lineHeight: 20 },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});
