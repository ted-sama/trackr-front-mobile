import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';

interface ExpandableSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  selectedFilter: 'books' | 'lists' | 'users';
  onFilterChange: (filter: 'books' | 'lists' | 'users') => void;
}

const COLLAPSED_HEIGHT = 52;
const EXPANDED_HEIGHT = 100;
const PILL_HEIGHT = 32;

export function ExpandableSearchBar({
  value,
  onChangeText,
  placeholder,
  selectedFilter,
  onFilterChange,
}: ExpandableSearchBarProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const height = useSharedValue(COLLAPSED_HEIGHT);
  const filterOpacity = useSharedValue(0);
  const filterTranslateY = useSharedValue(-10);

  const isFocused = value.length > 0;

  useEffect(() => {
    if (isFocused) {
      height.value = withTiming(EXPANDED_HEIGHT, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
      filterOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
      filterTranslateY.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
    } else {
      height.value = withTiming(COLLAPSED_HEIGHT, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
      filterOpacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
      filterTranslateY.value = withTiming(-10, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  const filterContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: filterOpacity.value,
      transform: [{ translateY: filterTranslateY.value }],
    };
  });

  const filters: Array<{ key: 'books' | 'lists' | 'users'; label: string }> = [
    { key: 'books', label: t('discover.filters.books') },
    { key: 'lists', label: t('discover.filters.lists') },
    { key: 'users', label: t('discover.filters.users') },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.searchBar,
          borderColor: colors.border,
        },
        containerStyle,
      ]}
    >
      {/* Search input row */}
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={20}
          color={colors.secondaryText}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, typography.caption, { color: colors.text, includeFontPadding: false, textAlignVertical: 'center' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills - shown when focused */}
      {isFocused && (
        <Animated.View style={[styles.filterContainer, filterContainerStyle]}>
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => onFilterChange(filter.key)}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    selectedFilter === filter.key ? colors.accent : colors.card,
                  borderColor:
                    selectedFilter === filter.key ? colors.accent : colors.border,
                },
              ]}
            >
              <Animated.Text
                style={[
                  typography.caption,
                  styles.pillText,
                  {
                    color:
                      selectedFilter === filter.key
                        ? 'white'
                        : colors.secondaryText,
                    fontWeight: selectedFilter === filter.key ? '600' : '500',
                  },
                ]}
              >
                {filter.label}
              </Animated.Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor:
      Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.589)' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    height: PILL_HEIGHT,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
  },
});
