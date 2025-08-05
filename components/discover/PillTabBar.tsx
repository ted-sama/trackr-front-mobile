import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, LayoutChangeEvent, Easing } from 'react-native';
import { useTypography } from '@/hooks/useTypography';
import { useTheme } from '@/contexts/ThemeContext';

export interface PillTabBarTab<T> {
  label: string;
  value: T;
}

interface PillTabBarProps<T> {
  tabs: PillTabBarTab<T>[];
  selected: T;
  onTabChange: (value: T) => void;
}

export default function PillTabBar<T extends string | number>({ tabs, selected, onTabChange }: PillTabBarProps<T>) {
  const selectedIndex = tabs.findIndex(tab => tab.value === selected);
  const tabAnim = useRef(new Animated.Value(selectedIndex >= 0 ? selectedIndex : 0)).current;
  const currentIndex = useRef(selectedIndex >= 0 ? selectedIndex : 0);
  const [tabWidth, setTabWidth] = useState(0);
  const typography = useTypography();
  const { colors } = useTheme();

  // Create animated values for text colors
  const textColorAnims = useRef(
    tabs.map((_, i) => new Animated.Value(i === selectedIndex ? 1 : 0))
  ).current;

  // Update animation when selected tab changes externally
  useEffect(() => {
    const newIndex = tabs.findIndex(tab => tab.value === selected);
    if (newIndex >= 0 && newIndex !== currentIndex.current) {
      currentIndex.current = newIndex;
      Animated.timing(tabAnim, {
        toValue: newIndex,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      animateTextColors(newIndex);
    }
  }, [selected, tabs]);

  const animateTextColors = (activeIndex: number) => {
    textColorAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === activeIndex ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Color interpolation needs JS thread
      }).start();
    });
  };

  const handleTabPress = (index: number, value: T) => {
    if (index === currentIndex.current) return;
    
    currentIndex.current = index;
    onTabChange(value);
    Animated.timing(tabAnim, {
      toValue: index,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    animateTextColors(index);
  };

  const highlightTranslateX = tabAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    const innerWidth = width - 12; // padding
    const calculatedTabWidth = innerWidth / tabs.length;
    setTabWidth(calculatedTabWidth);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: colors.card }]} onLayout={onLayout}>
        <Animated.View
          style={[
            styles.highlight,
            {
              width: tabWidth,
              backgroundColor: colors.primary,
              transform: [{ translateX: highlightTranslateX }],
            },
          ]}
        />
        {tabs.map((tab, i) => {
          const animatedTextColor = textColorAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [colors.secondaryText, '#FFFFFF'],
          });

          return (
            <Pressable
              key={String(tab.value)}
              style={styles.tab}
              onPress={() => handleTabPress(i, tab.value)}
            >
              <Animated.Text
                style={[
                  typography.caption,
                  styles.tabText,
                  { 
                    color: animatedTextColor,
                    fontWeight: selected === tab.value ? '600' : '500'
                  },
                ]}
              >
                {tab.label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 6,
    position: 'relative',
    height: 44,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  highlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 19,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: 32,
    borderRadius: 16,
  },
  tabText: {
    fontSize: 14,
  },
});