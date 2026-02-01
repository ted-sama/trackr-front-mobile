import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Avatar from "@/components/ui/Avatar";
import { User } from "@/types/user";
import { useUserSearch } from "@/hooks/queries/comments";

interface MentionAutocompleteProps {
  visible: boolean;
  query: string;
  onSelect: (user: User) => void;
  onClose: () => void;
  targetLayout: { x: number; y: number; width: number; height: number } | null;
}

export const MentionAutocomplete = ({
  visible,
  query,
  onSelect,
  onClose,
  targetLayout,
}: MentionAutocompleteProps) => {
  const { colors } = useTheme();
  const typography = useTypography();
  const { data: users, isLoading } = useUserSearch(query);

  if (!visible || !targetLayout || (!users?.length && !isLoading)) return null;

  return (
    <View
      style={[
        styles.autocompleteContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          bottom: targetLayout.height + 10, // Position above the input
        },
      ]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 200 }}
      >
        {users?.map((user) => (
          <Pressable
            key={user.id}
            style={({ pressed }) => [
              styles.userItem,
              pressed && { backgroundColor: colors.background },
            ]}
            onPress={() => onSelect(user)}
          >
            <Avatar image={user.avatar} size={24} />
            <View style={styles.userInfo}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {user.username}
              </Text>
              <Text
                style={[
                  typography.bodyCaption,
                  { color: colors.secondaryText },
                ]}
              >
                {user.displayName}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  autocompleteContainer: {
    position: "absolute",
    left: 56, // Align with input
    right: 12,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
});
