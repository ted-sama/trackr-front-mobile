import React, { ReactNode, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate, Extrapolate, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import * as Haptics from "expo-haptics";
import { ReadingStatus } from "@/types";
import { Clock3, BookOpenIcon, BookCheck, Pause, Square } from "lucide-react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";

interface TrackingTabBarProps {
  status: string;
  onManagePress: () => void;
  expanded: boolean;
  onClose: () => void;
  children?: ReactNode;
  onStatusPress: () => void;
}

export function TrackingTabBar({
  status,
  onManagePress,
  expanded,
  onClose,
  children,
  onStatusPress,
}: TrackingTabBarProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const trackingStatusValues: Record<ReadingStatus, { text: string, icon: React.ReactNode }> = {
    'plan_to_read': { text: 'À lire', icon: <Clock3 size={20} strokeWidth={2.75} color={colors.planToRead} /> },
    'reading': { text: 'En cours', icon: <BookOpenIcon size={20} strokeWidth={2.75} color={colors.reading} /> },
    'completed': { text: 'Complété', icon: <BookCheck size={20} strokeWidth={2.75} color={colors.completed} /> },
    'on_hold': { text: 'En pause', icon: <Pause size={20} strokeWidth={2.75} color={colors.onHold} /> },
    'dropped': { text: 'Abandonné', icon: <Square size={20} strokeWidth={2.75} color={colors.dropped} /> },
  }

  // Animation shared values
  const anim = useSharedValue(expanded ? 1 : 0);
  const dragY = useSharedValue(0);
  const hasPassedThreshold = useSharedValue(false);
  const DRAG_THRESHOLD = 60;
  const RESISTANCE = 0.22; // plus petit = plus résistant après le seuil

  // Animate when expanded prop changes
  useEffect(() => {
    anim.value = withTiming(expanded ? 1 : 0, { duration: 400 });
  }, [expanded]);

  // Reset dragY et hasPassedThreshold quand collapsing
  useEffect(() => {
    if (!expanded) {
      dragY.value = withTiming(0, { duration: 200 });
      hasPassedThreshold.value = false;
    }
  }, [expanded]);

  // Animated styles for morphing
  const animatedContainerStyle = useAnimatedStyle(() => {
    const pillWidth = screenWidth * 0.92;
    const sheetWidth = screenWidth;
    const pillHeight = 64;
    const sheetHeight = screenHeight * 0.8;
    // Natural morph: combine expansion anim and dragY for shape/size during drag
    const dragFactor = interpolate(dragY.value, [0, sheetHeight], [1, 0], Extrapolate.CLAMP);
    const morphFactor = anim.value * dragFactor;
    const borderRadius = interpolate(morphFactor, [0, 1], [50, 32], Extrapolate.CLAMP);
    const borderWidth = interpolate(morphFactor, [0, 1], [1, 0], Extrapolate.CLAMP);
    const width = interpolate(morphFactor, [0, 1], [pillWidth, sheetWidth], Extrapolate.CLAMP);
    const height = interpolate(morphFactor, [0, 1], [pillHeight, sheetHeight], Extrapolate.CLAMP);
    const bottom = interpolate(anim.value, [0, 1], [insets.bottom + 16, 0], Extrapolate.CLAMP);
    return {
      width,
      height,
      borderWidth,
      borderColor: colors.tabBarBorder,
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: interpolate(morphFactor, [0, 1], [50, 0], Extrapolate.CLAMP),
      borderBottomRightRadius: interpolate(morphFactor, [0, 1], [50, 0], Extrapolate.CLAMP),
      position: "absolute",
      left: (screenWidth - width) / 2,
      right: (screenWidth - width) / 2,
      bottom,
      backgroundColor: colors.card,
      shadowColor: Platform.OS === "android" ? "rgba(0,0,0,0.589)" : "rgba(0,0,0,0.1)",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 12,
      overflow: "hidden",
      zIndex: 100,
      transform: [
        { translateY: dragY.value }
      ],
    };
  });

  // Content opacity/translate animation
  const pillContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.2], [1, 0], Extrapolate.CLAMP),
    transform: [{ translateY: interpolate(anim.value, [0, 0.2], [0, 40], Extrapolate.CLAMP) }],
    pointerEvents: anim.value < 0.5 ? "auto" : "none",
  }));
  const sheetContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0.7, 1], [0, 1], Extrapolate.CLAMP),
    transform: [{ translateY: interpolate(anim.value, [0.7, 1], [40, 0], Extrapolate.CLAMP) }],
    pointerEvents: anim.value > 0.5 ? "auto" : "none",
  }));

  // Gesture handler for drag-to-close (modern API)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      let y = event.translationY;
      if (y <= 0) y = 0;
      if (y < DRAG_THRESHOLD) {
        dragY.value = y;
        hasPassedThreshold.value = false;
      } else {
        // résistance après le seuil
        dragY.value = DRAG_THRESHOLD + (y - DRAG_THRESHOLD) * RESISTANCE;
        if (!hasPassedThreshold.value) {
          hasPassedThreshold.value = true;
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    })
    .onEnd(() => {
      if (dragY.value > DRAG_THRESHOLD) {
        runOnJS(onClose)();
      } else {
        dragY.value = withSpring(0, { damping: 20, stiffness: 150 });
      }
      hasPassedThreshold.value = false;
    });

  return (
    <>
    {/* Blur gradient mask under the button (100% blur bottom → 0% blur top) */}
    <View pointerEvents="none" style={[
        styles.blurGradientContainer,
        { bottom: 0, height: insets.bottom + 16 + 40 },
      ]}>
        <MaskedView
          style={StyleSheet.absoluteFillObject}
          maskElement={
            <LinearGradient
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              colors={[ '#fff', 'transparent' ]}
              style={StyleSheet.absoluteFillObject}
            />
          }
        >
          <BlurView intensity={100} tint={currentTheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        </MaskedView>
      </View>

    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={[styles.container, animatedContainerStyle]}
        accessibilityRole="menu"
        accessibilityLabel="Gestion du suivi"
      >
        {/* Pill content */}
        <Animated.View style={[styles.pillContent, pillContentStyle]} pointerEvents={expanded ? "none" : "auto"}>
          <View style={styles.row}>
            <Pressable onPress={onStatusPress}>
              <View style={styles.statusContainer}>
                {trackingStatusValues[status as ReadingStatus].icon}
                <Text style={[typography.trackingTabBar, { color: colors.text }]} numberOfLines={1} accessibilityLabel={`Statut de suivi : ${status}`}>{trackingStatusValues[status as ReadingStatus].text}</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.manageButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              onPress={onManagePress}
              accessibilityRole="button"
              accessibilityLabel="Gérer le suivi"
            >
              <LinearGradient
                colors={[colors.primary, "#8A2BE2"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[typography.trackingTabBar, { color: "#fff" }]}>Gérer le suivi</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
        {/* Bottom sheet content */}
        <Animated.View style={[styles.sheetContent, sheetContentStyle]} pointerEvents={expanded ? "auto" : "none"}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 7,
    marginTop: 54,
  },
  statusContainer: {
    flexDirection: "row",
    marginLeft: 12,
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  manageButton: {
    borderRadius: 100,
    overflow: "hidden",
    marginLeft: 16,
    minWidth: 100,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  pillContent: {
    flex: 1,
    justifyContent: "center",
    height: 56,
  },
  sheetContent: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  blurGradientContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
}); 