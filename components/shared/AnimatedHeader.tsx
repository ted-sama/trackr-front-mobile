import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolate, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

function ScalePressable({ onPress, style, children }: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.92, { duration: 220 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 220 }); }}
      style={[style, animatedStyle]}
      {...(onPress && { pointerEvents: 'box-only' })}
    >
      {children}
    </AnimatedPressable>
  );
}

interface AnimatedHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  collapseThreshold?: number;
  onBack?: () => void;
  closeRightButtonIcon?: React.ReactNode;
  onCloseRightButtonPress?: () => void;
  rightButtonIcon?: React.ReactNode;
  onRightButtonPress?: () => void;
  farRightButtonIcon?: React.ReactNode;
  onFarRightButtonPress?: () => void;
  rightComponent?: React.ReactNode; // Custom component rendered on the right without button styling
  static?: boolean; // When true, displays header in final state without animation
}

const DEFAULT_THRESHOLD = 320;

export function AnimatedHeader({ title, scrollY, collapseThreshold = DEFAULT_THRESHOLD, onBack, closeRightButtonIcon, onCloseRightButtonPress, rightButtonIcon, onRightButtonPress, farRightButtonIcon, onFarRightButtonPress, rightComponent, static: isStatic = false }: AnimatedHeaderProps) {
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
      <Animated.View style={[StyleSheet.absoluteFillObject, headerContainerStyle, { paddingBottom: -40 }]}>
        <MaskedView
          style={[StyleSheet.absoluteFillObject, { height: '140%' }]}
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
              { backgroundColor: currentTheme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.65)' }
            ]}
          />
        </MaskedView>
      </Animated.View>
      <View style={[styles.content, { paddingTop: insets.top }]}> 
        {onBack && (
          <ScalePressable onPress={onBack} style={styles.backButton}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.backButtonBg,
                {
                  backgroundColor: colors.backButtonBackground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  elevation: 1,
                },
              ]}
            />
            <Ionicons name="arrow-back" size={22} color={colors.icon} />
          </ScalePressable>
        )}
        <Animated.Text
          style={[typography.h3, styles.title, { color: colors.text }, headerTitleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Animated.Text>
        {/* Right side: custom component or button icons */}
        {rightComponent ? (
          <View style={styles.rightComponentContainer}>
            {rightComponent}
          </View>
        ) : (
          <View style={[styles.rightContainer, { width: farRightButtonIcon ? (closeRightButtonIcon ? 148 : 96) : (closeRightButtonIcon ? 96 : 44) }]}>
            {closeRightButtonIcon ? (
              <ScalePressable onPress={onCloseRightButtonPress} style={styles.closeRightButton}>
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.backButtonBg,
                    {
                      backgroundColor: colors.backButtonBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                />
                {closeRightButtonIcon}
              </ScalePressable>
            ) : null}
            {rightButtonIcon ? (
              <ScalePressable onPress={onRightButtonPress} style={styles.rightButton}>
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.backButtonBg,
                    {
                      backgroundColor: colors.backButtonBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                />
                {rightButtonIcon}
              </ScalePressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
            {farRightButtonIcon ? (
              <ScalePressable onPress={onFarRightButtonPress} style={styles.rightButton}>
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.backButtonBg,
                    {
                      backgroundColor: colors.backButtonBackground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                />
                {farRightButtonIcon}
              </ScalePressable>
            ) : null}
          </View>
        )}
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
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    overflow: 'hidden',
  },
  backButtonBg: {
    borderRadius: '50%',
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
  rightComponentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeRightButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    overflow: 'hidden',
  },
  rightButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    overflow: 'hidden',
  },
}); 