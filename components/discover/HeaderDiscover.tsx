import React, { useEffect } from "react";
import { View, StyleSheet, StatusBar, NativeSyntheticEvent, TextInputSubmitEditingEventData, TouchableOpacity, Text, Dimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useTheme } from "@/contexts/ThemeContext";
import SearchBar from "@/components/discover/SearchBar";
import PillTabBar from "@/components/discover/PillTabBar";
import { useRouter } from "expo-router";
import { useTypography } from "@/hooks/useTypography";
import { useSearchStore } from "@/stores/searchStore";
type TabType = 'books' | 'lists';

interface HeaderDiscoverProps {
  searchMode: 'navigate' | 'search';
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
  onSubmitSearch?: () => void;
  activeFilter?: TabType;
  onFilterChange?: (filter: TabType) => void;
  // Navigation tabs props
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

const screenWidth = Dimensions.get('window').width;
const cancelButtonWidth = 60;
const searchBarMarginRight = 10;
const paddingHorizontal = 16;

export default function HeaderDiscover({
  searchMode,
  searchText = '',
  onSearchTextChange = () => {},
  onSubmitSearch = () => {},
  activeFilter = 'books',
  onFilterChange = () => {},
  activeTab = 'books',
  onTabChange = () => {},
}: HeaderDiscoverProps) {
  const insets = useSafeAreaInsets();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const { clearSearch } = useSearchStore();
  const initialWidth = screenWidth - paddingHorizontal * 2;
  const searchBarWidth = useSharedValue(initialWidth);
  const cancelButtonOpacity = useSharedValue(0);
  const cancelButtonTranslateX = useSharedValue(30);

  const isEditable = searchMode === 'search';

  useEffect(() => {
    if (isEditable) {
      const finalSearchBarWidth = screenWidth - paddingHorizontal * 2 - cancelButtonWidth - searchBarMarginRight;
      searchBarWidth.value = withTiming(finalSearchBarWidth, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
      cancelButtonOpacity.value = withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) });
      cancelButtonTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
    } else {
      searchBarWidth.value = initialWidth;
      cancelButtonOpacity.value = 0;
      cancelButtonTranslateX.value = 30;
    }
  }, [isEditable, initialWidth]);

  const handleNavigateToSearch = () => {
    router.navigate('/discover/search');
  };

  const performBackNavigation = () => {
    clearSearch();
    router.back();
  };

  const handleCancel = () => {
    searchBarWidth.value = withTiming(
      initialWidth,
      {
        duration: 300,
        easing: Easing.out(Easing.quad),
      },
      () => {
        runOnJS(performBackNavigation)();
      }
    );
    cancelButtonOpacity.value = withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) });
    cancelButtonTranslateX.value = withTiming(30, { duration: 300, easing: Easing.out(Easing.quad) });
  };

  const handleSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    if (searchMode === 'search') {
      onSubmitSearch();
    }
  };

  const animatedSearchBarContainerStyle = useAnimatedStyle(() => {
    return {
      width: searchBarWidth.value,
    };
  });

  const animatedCancelButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: cancelButtonOpacity.value,
      transform: [{ translateX: cancelButtonTranslateX.value }],
    };
  });

  const navigationTabs = [
    { label: 'Livres', value: 'books' as TabType },
    { label: 'Listes', value: 'lists' as TabType },
  ];

  return (
    <>
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: 130 + insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      <StatusBar
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Commencez votre recherche"
          isEditable={isEditable}
          value={searchText}
          onChangeText={isEditable ? onSearchTextChange : () => {}}
          onSubmitEditing={isEditable ? handleSubmitEditing : undefined}
          onPressNavigate={!isEditable ? handleNavigateToSearch : undefined}
          containerStyle={animatedSearchBarContainerStyle}
        />
        {isEditable && (
          <Animated.View style={[styles.cancelButtonContainer, animatedCancelButtonStyle]}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={[typography.h3, { color: colors.primary }]}>Annuler</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Navigation tabs in navigate mode - inside header */}
      {searchMode === 'navigate' && (
        <View style={styles.navigationContainerInHeader}>
          <PillTabBar
            tabs={navigationTabs}
            selected={activeTab}
            onTabChange={onTabChange}
          />
        </View>
      )}

      {/* Filter buttons in search mode - inside header */}
      {searchMode === 'search' && (
        <View style={styles.filterContainerInHeader}>
          <Pressable
            style={[
              styles.filterButton,
              activeFilter === 'books' && { backgroundColor: colors.primary }
            ]}
            onPress={() => onFilterChange('books')}
          >
            <Text style={[
              typography.caption,
              styles.filterText,
              { color: activeFilter === 'books' ? 'white' : colors.text }
            ]}>
              Livres
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.filterButton,
              activeFilter === 'lists' && { backgroundColor: colors.primary }
            ]}
            onPress={() => onFilterChange('lists')}
          >
            <Text style={[
              typography.caption,
              styles.filterText,
              { color: activeFilter === 'lists' ? 'white' : colors.text }
            ]}>
              Listes
            </Text>
          </Pressable>
        </View>
      )}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: paddingHorizontal,
    paddingBottom: 10,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButtonContainer: {
    marginLeft: searchBarMarginRight,
    justifyContent: 'center',
    height: 52,
  },
  cancelButton: {
    paddingHorizontal: 5,
  },
  navigationContainerInHeader: {
    marginTop: 8,
  },
  filterContainerInHeader: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersContainer: {
    height: 50,
    borderBottomWidth: 1,
    paddingHorizontal: paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontWeight: '500',
  },
});
