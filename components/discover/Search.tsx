import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useSearchAnimation } from '../../contexts/SearchAnimationContext';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface SearchProps {
  onSearch?: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

const Search = ({ onSearch, placeholder = 'Rechercher un manga...', onPress }: SearchProps) => {
  const [searchText, setSearchText] = useState('');
  const { colors } = useTheme();
  const router = useRouter();
  const { searchBarRef, searchBarHeight, searchBarWidth, searchBarY, searchBarX, isSearchExpanded } = useSearchAnimation();

  // Mesurer la position du champ de recherche
  useEffect(() => {
    if (searchBarRef.current) {
      searchBarRef.current.measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
        searchBarHeight.value = height;
        searchBarWidth.value = width;
        searchBarX.value = pageX;
        searchBarY.value = pageY;
      });
    }
  }, []);

  const handleNavigateToSearch = () => {
    router.push('/discover/search');
  };
  const animatedStyle = useAnimatedStyle(() => {
    return {
      zIndex: isSearchExpanded.value ? 0 : 1,
      transform: [
        {
          scale: withTiming(isSearchExpanded.value ? 1.05 : 1, {
            duration: 300,
          }),
        },
      ],
    };
  });

  return (
    <TouchableWithoutFeedback style={{width: '100%'}} onPress={handleNavigateToSearch}>
      <Animated.View
        ref={searchBarRef}
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.secondaryText}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          value={searchText}
          autoCapitalize="none"
          autoCorrect={false}
          editable={false}
          onPress={handleNavigateToSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 12,
    width: '100%',
    shadowColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.589)' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
  },
  clearButton: {
    padding: 4,
  },
});

export default Search;