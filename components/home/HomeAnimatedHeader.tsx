import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Avatar from '@/components/ui/Avatar';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import { useUserStore } from '@/stores/userStore';
import { router } from 'expo-router';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';

interface HomeAnimatedHeaderProps {
  scrollY: SharedValue<number>;
  collapseThreshold?: number;
}

const DEFAULT_THRESHOLD = 60;
const HEADER_HEIGHT = 56;
const VERTICAL_SPACING = 12;

export function HomeAnimatedHeader({
  scrollY,
  collapseThreshold = DEFAULT_THRESHOLD,
}: HomeAnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { currentTheme, colors } = useTheme();
  const { currentUser } = useUserStore();
  const typography = useTypography();
  const { t } = useTranslation();

  const totalHeight = insets.top + HEADER_HEIGHT + VERTICAL_SPACING;

  const headerContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, collapseThreshold],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      {/* Blurred background with gradient */}
      <Animated.View style={[StyleSheet.absoluteFillObject, headerContainerStyle]}>
        <MaskedView
          style={[StyleSheet.absoluteFillObject, { height: '120%' }]}
          maskElement={
            <LinearGradient
              colors={[
                'black',
                'black',
                'black',
                'rgba(0, 0, 0, 0.98)',
                'rgba(0, 0, 0, 0.95)',
                'rgba(0, 0, 0, 0.9)',
                'rgba(0, 0, 0, 0.85)',
                'rgba(0, 0, 0, 0.75)',
                'rgba(0, 0, 0, 0.6)',
                'rgba(0, 0, 0, 0.45)',
                'rgba(0, 0, 0, 0.3)',
                'rgba(0, 0, 0, 0.18)',
                'rgba(0, 0, 0, 0.08)',
                'rgba(0, 0, 0, 0.02)',
                'transparent',
              ]}
              locations={[0, 0.25, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.94, 0.97, 1]}
              style={{ flex: 1 }}
            />
          }
          pointerEvents="none"
        >
          <BlurView
            intensity={20}
            tint='dark'
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.65)' }
            ]}
          />
        </MaskedView>
      </Animated.View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + VERTICAL_SPACING }]}>
        <Pressable onPress={() => router.push("/me")}>
          <Avatar
            image={currentUser?.avatar || ""}
            size={36}
            borderWidth={1}
            borderColor={colors.border}
          />
        </Pressable>
        <NotificationBadge />
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
    zIndex: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
});
