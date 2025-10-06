import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/discover/SearchBar';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';

interface HeaderCollectionProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSubmitSearch?: () => void;
}

const screenWidth = Dimensions.get('window').width;
const paddingHorizontal = 16;

const CANCEL_BUTTON_EFFECTIVE_WIDTH = 90; // Estimated total width for the "Annuler" button including its horizontal spacing

export function HeaderCollection({
  searchText,
  onSearchTextChange,
  onSubmitSearch,
}: HeaderCollectionProps) {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { t } = useTranslation();
  const initialWidth = screenWidth - paddingHorizontal * 2;

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
          borderBottomColor: colors.tabBarBorder,
        },
      ]}
    >
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {isSearchActive ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SearchBar
            placeholder={t("collection.searchPlaceholder")}
            isEditable
            value={searchText}
            onChangeText={onSearchTextChange}
            onSubmitEditing={onSubmitSearch}
            containerStyle={{ flex: 1 }}
          />
          <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
            <Text style={[typography.h3, { color: colors.primary }]}>{t("discover.cancel")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.titleRow}>
          <Text style={[typography.h1, { color: colors.text, flex: 1 }]} numberOfLines={1}>
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
  },
  searchIconButton: {
    marginLeft: 12,
    padding: 8,
  },
  cancelButton: {
    marginLeft: 10,
    paddingHorizontal: 5,
  },
});

export default HeaderCollection; 