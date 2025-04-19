import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, LayoutChangeEvent } from 'react-native';
import { useTypography } from '@/hooks/useTypography';
import { useTheme } from '@/contexts/ThemeContext';

export interface TabBarTab<T> {
  label: string;
  value: T;
}

interface TabBarProps<T> {
  tabs: TabBarTab<T>[];
  selected: T;
  onTabChange: (value: T) => void;
}

export default function TabBar<T extends string | number>({ tabs, selected, onTabChange }: TabBarProps<T>) {
  const selectedIndex = tabs.findIndex(tab => tab.value === selected);
  const tabAnim = useRef(new Animated.Value(selectedIndex >= 0 ? selectedIndex : 0)).current;
  const [tabWidth, setTabWidth] = useState(0);
  const typography = useTypography();
  const { colors } = useTheme();

  // Animation lors du switch
  const handleTabPress = (index: number, value: T) => {
    onTabChange(value);
    Animated.timing(tabAnim, {
      toValue: index,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Interpolation pour le highlight
  const highlightTranslate = tabAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => 4 + i * tabWidth),
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTabWidth((width - 8) / tabs.length); // 8 = padding horizontal total (4px de chaque côté)
  };

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={[styles.container, { backgroundColor: colors.tabBarBackground }]} onLayout={onLayout}>
        <Animated.View
          style={[
            styles.highlight,
            {
              left: highlightTranslate,
              width: tabWidth,
              backgroundColor: colors.tabBarHighlight,
              shadowColor: colors.tabBarHighlight,
            },
          ]}
        />
        {tabs.map((tab, i) => (
          <Pressable
            key={String(tab.value)}
            style={styles.tab}
            onPress={() => handleTabPress(i, tab.value)}
          >
            <Text
              style={[
                typography.h3,
                styles.tabText,
                { color: selected === tab.value ? colors.tabBarTextActive : colors.tabBarText },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
    marginBottom: 8,
    height: 48,
    alignItems: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    borderRadius: 12,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: 40,
    borderRadius: 12,
  },
  tabText: {},
}); 