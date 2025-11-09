import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const SearchBar = ({
  value,
  onChangeText,
  placeholder,
  containerStyle,
}: SearchBarProps) => {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: colors.searchBar,
          borderColor: colors.border,
        },
        containerStyle,
      ]}
    >
      <Ionicons
        name="search"
        size={20}
        color={colors.secondaryText}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, typography.caption, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
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
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    shadowColor:
      Platform.OS === "android" ? "rgba(0, 0, 0, 0.589)" : "rgba(0, 0, 0, 0.1)",
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
    height: "100%",
    paddingVertical: Platform.OS === "android" ? 8 : 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export default SearchBar;
