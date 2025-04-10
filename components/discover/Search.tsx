import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchProps {
  onSearch?: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

const Search = ({ onSearch, placeholder = 'Rechercher un manga...', onPress }: SearchProps) => {
  const [searchText, setSearchText] = useState('');
  const { colors } = useTheme();

  const handleChangeText = (text: string) => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleClearText = () => {
    setSearchText('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
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
          onChangeText={handleChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          editable={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearText} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>
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