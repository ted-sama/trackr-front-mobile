import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolate, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useDropdownContext } from '../contexts/DropdownContext';

type Option = { label: string; value: string; details?: string };

interface DropdownSelectorProps {
  options: Option[];
  selectedValue: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({ options, selectedValue, onValueChange, placeholder = 'Select an option' }) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const animatedValue = useSharedValue(0);
  const { openDropdownId, setOpenDropdownId } = useDropdownContext();
  const idRef = useRef<string>(Math.random().toString());
  const isOpen = openDropdownId === idRef.current;
  useEffect(() => {
    animatedValue.value = withTiming(isOpen ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isOpen]);

  const toggleOpen = () => {
    if (isOpen) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(idRef.current);
    }
  };

  const chevronAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      animatedValue.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const listContainerAnimatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      animatedValue.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      animatedValue.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scaleY }],
    };
  });

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label;

  return (
    <View style={styles.container}>
      <Pressable style={[styles.header, { backgroundColor: colors.tabBarBackground }]} onPress={toggleOpen}>
        <Text style={[typography.h3, styles.headerText, { color: selectedValue ? colors.tabBarTextActive : colors.tabBarText }]}>  
          {selectedLabel || placeholder}
        </Text>
        <Animated.View style={[styles.chevronContainer, chevronAnimatedStyle]}>
          <Ionicons name="chevron-down" size={20} color={colors.tabBarText} />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.listContainerWrapper, listContainerAnimatedStyle]}>
        <View style={styles.listContainerInner}>
          <View style={[
            styles.listContainer,
            {
              backgroundColor: colors.tabBarBackground,
              borderWidth: 0,
              shadowColor: colors.tabBarHighlight,
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }
          ]}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.tabBarHighlight }]}
                  onPress={() => { onValueChange(item.value); toggleOpen(); }}
                >
                  <Text style={[typography.h3, styles.itemText, { color: colors.tabBarText }]}>{item.label}</Text>
                  {item.details && <Text style={[typography.h3, styles.itemText, { color: colors.tabBarText }]}>{item.details}</Text>}
                </Pressable>
              )}
              style={{ maxHeight: 200 }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default DropdownSelector;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    height: 48,
    borderRadius: 16,
  },
  headerText: {
    fontSize: 14,
    paddingHorizontal: 12,
    flex: 1,
  },
  chevronContainer: {
    paddingHorizontal: 12,
  },
  listContainerWrapper: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
    transformOrigin: 'top',
  },
  listContainerInner: {
  },
  listContainer: {
    borderRadius: 16,
    marginTop: 4,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 14,
  },
}); 