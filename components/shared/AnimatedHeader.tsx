import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface AnimatedHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  collapseThreshold?: number;
  onBack: () => void;
}

const DEFAULT_THRESHOLD = 320;

export function AnimatedHeader({ title, scrollY, collapseThreshold = DEFAULT_THRESHOLD, onBack }: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();

  const headerContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, collapseThreshold - 10],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [collapseThreshold, collapseThreshold + 40],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const backButtonBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, collapseThreshold - 10],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={[styles.container, { height: 60 + insets.top }]}> 
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.background,
          headerContainerStyle,
          { borderBottomColor: colors.border, borderBottomWidth: 1 },
        ]}
      >
        <BlurView
          intensity={80}
          tint={currentTheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)' }
          ]}
        />
      </Animated.View>
      <View style={[styles.content, { paddingTop: insets.top }]}> 
        <Pressable onPress={onBack} style={styles.backButton}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.backButtonBg,
              { backgroundColor: colors.transparentBackground },
              backButtonBgStyle,
            ]}
          />
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </Pressable>
        <Animated.Text
          style={[typography.h3, styles.title, { color: colors.text }, headerTitleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Animated.Text>
        <View style={{ width: 36 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 98,
  },
  background: {
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 38,
    minHeight: 38,
    overflow: 'hidden',
  },
  backButtonBg: {
    borderRadius: 25,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
}); 