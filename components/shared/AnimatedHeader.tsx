import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface AnimatedHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  collapseThreshold?: number;
  onBack?: () => void;
  closeRightButton?: React.ReactNode;
  rightButton?: React.ReactNode;
  static?: boolean; // When true, displays header in final state without animation
}

const DEFAULT_THRESHOLD = 320;

export function AnimatedHeader({ title, scrollY, collapseThreshold = DEFAULT_THRESHOLD, onBack, closeRightButton, rightButton, static: isStatic = false }: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();

  const headerContainerStyle = useAnimatedStyle(() => {
    if (isStatic) {
      return { opacity: 1 };
    }
    const opacity = interpolate(
      scrollY.value,
      [0, collapseThreshold - 10],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    if (isStatic) {
      return { opacity: 1 };
    }
    const opacity = interpolate(
      scrollY.value,
      [collapseThreshold - 60, collapseThreshold + 10],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={[styles.container, { height: 80 + insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, headerContainerStyle]}>
        <MaskedView
          style={StyleSheet.absoluteFillObject}
          maskElement={
            <LinearGradient
              colors={[
                'rgba(0, 0, 0, 1)',
                'rgba(0, 0, 0, 1)',
                'rgba(0, 0, 0, 0.98)',
                'rgba(0, 0, 0, 0.95)',
                'rgba(0, 0, 0, 0.9)',
                'rgba(0, 0, 0, 0.82)',
                'rgba(0, 0, 0, 0.7)',
                'rgba(0, 0, 0, 0.55)',
                'rgba(0, 0, 0, 0.4)',
                'rgba(0, 0, 0, 0.25)',
                'rgba(0, 0, 0, 0.12)',
                'rgba(0, 0, 0, 0.05)',
                'rgba(0, 0, 0, 0.02)',
                'rgba(0, 0, 0, 0)',
              ]}
              locations={[0, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.94, 0.97, 1]}
              dither={true}
              style={{ flex: 1 }}
            />
          }
        >
          <BlurView
            intensity={20}
            tint='dark'
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)' }
            ]}
          />
        </MaskedView>
      </Animated.View>
      <View style={[styles.content, { paddingTop: insets.top }]}> 
        {onBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.backButtonBg,
                { backgroundColor: colors.backButtonBackground },
              ]}
            />
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
          </Pressable>
        )}
        <Animated.Text
          style={[typography.h3, styles.title, { color: colors.text }, headerTitleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Animated.Text>
        {/* width: 80, -- 36*2 (buttons) + 8 (gap) */}
        <View style={[styles.rightContainer, { width: closeRightButton ? 80 : 36 }]}>
          {closeRightButton ? (
            <View style={styles.closeRightButton}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.backButtonBg,
                  { backgroundColor: colors.backButtonBackground },
                ]}
              />
              {closeRightButton}
            </View>
          ) : null}
          {rightButton ? (
            <View style={styles.rightButton}>
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.backButtonBg,
                  { backgroundColor: colors.backButtonBackground },
                ]}
              />
              {rightButton}
            </View>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
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
    marginHorizontal: 8,
  },
  rightContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  closeRightButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 38,
    minHeight: 38,
    overflow: 'hidden',
  },
  rightButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 38,
    minHeight: 38,
    overflow: 'hidden',
  },
}); 