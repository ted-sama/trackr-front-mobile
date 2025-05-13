import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/discover/SearchBar';
import { useTypography } from '@/hooks/useTypography';

interface HeaderCollectionProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSubmitSearch?: () => void;
}

const screenWidth = Dimensions.get('window').width;
const searchBarMarginRight = 10;
const paddingHorizontal = 16;

export function HeaderCollection({
  searchText,
  onSearchTextChange,
  onSubmitSearch,
}: HeaderCollectionProps) {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const [isSearchActive, setIsSearchActive] = useState(false);

  const initialWidth = screenWidth - paddingHorizontal * 2; // Total available width for header content
  const searchBarWidth = useSharedValue(initialWidth); // Shared value for SearchBar's width

  // Calculate the space needed for the cancel button
  const cancelIconSize = 24;
  // Assuming styles.cancelButton.padding is a number (e.g., 8)
  const cancelPadding = typeof styles.cancelButton.padding === 'number' ? styles.cancelButton.padding : 0;
  const cancelButtonPaddingHorizontal = cancelPadding * 2;
  const cancelButtonMarginLeft = typeof styles.cancelButton.marginLeft === 'number' ? styles.cancelButton.marginLeft : 0;
  const spaceNeededForCancelButton = cancelIconSize + cancelButtonPaddingHorizontal + cancelButtonMarginLeft;

  useEffect(() => {
    if (isSearchActive) {
      // Animate SearchBar to fill available space next to the cancel button
      searchBarWidth.value = withTiming(initialWidth - spaceNeededForCancelButton, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      // When search is not active, SearchBar component is unmounted.
      // Resetting searchBarWidth to initialWidth (or another baseline) is fine.
      // This value would be the starting point if the search becomes active again.
      searchBarWidth.value = withTiming(initialWidth, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isSearchActive, initialWidth, spaceNeededForCancelButton, searchBarWidth]);

  const animatedSearchBarContainerStyle = useAnimatedStyle(() => {
    return {
      width: searchBarWidth.value,
    };
  });

  const handleSearchIconPress = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const handleCancelSearch = useCallback(() => {
    setIsSearchActive(false);
    onSearchTextChange('');
  }, [onSearchTextChange]);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: 72 + insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {isSearchActive ? (
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <SearchBar
            placeholder="Rechercher dans la collection..."
            isEditable
            value={searchText}
            onChangeText={onSearchTextChange}
            onSubmitEditing={onSubmitSearch}
            containerStyle={animatedSearchBarContainerStyle}
          />
          <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.titleRow}>
          <Text style={[typography.headerTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            Collection
          </Text>
          <TouchableOpacity onPress={handleSearchIconPress} style={styles.searchIconButton}>
            <Ionicons name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: paddingHorizontal,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  searchIconButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
  },
  cancelButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
  },
});

export default HeaderCollection; 