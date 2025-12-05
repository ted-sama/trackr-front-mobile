import React, { forwardRef, useCallback, useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useCreateList } from "@/hooks/queries/lists";
import { toast } from "sonner-native";
import Button from "./ui/Button";

export interface CreateListBottomSheetProps {
  onDismiss?: () => void;
  onListCreated?: (listId: string) => void;
}

const CreateListBottomSheet = forwardRef<
  TrueSheet,
  CreateListBottomSheetProps
>(({ onDismiss, onListCreated }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();
  const { mutateAsync: createList } = useCreateList();
  const [newListName, setNewListName] = useState("");

  const resetState = useCallback(() => {
    setNewListName("");
  }, []);

  const closeSheet = useCallback(() => {
    resetState();
    const sheetRef = typeof ref === "object" ? ref?.current : null;
    if (sheetRef) {
      sheetRef.dismiss();
    }
  }, [ref, resetState]);

  const handleSheetDismiss = useCallback(() => {
    resetState();
    onDismiss?.();
  }, [onDismiss, resetState]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    try {
      const newList = await createList(newListName.trim());
      toast.success(t("toast.listCreated"));
      onListCreated?.(newList.id);
      closeSheet();
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error(t("toast.errorCreatingList"));
    }
  };

  return (
    <TrueSheet
      ref={ref}
      detents={["auto"]}
      cornerRadius={30}
      backgroundColor={colors.background}
      grabber={false}
      onDidDismiss={handleSheetDismiss}
    >
      <View style={styles.bottomSheetContent}>
        <View style={styles.header}>
          <Text
            style={[
              typography.categoryTitle,
              { color: colors.text, textAlign: "center" },
            ]}
          >
            {t("bookBottomSheet.listEditor.createList")}
          </Text>
        </View>
        <View style={{ marginBottom: 36 }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <TextInput
              placeholder={t("bookBottomSheet.listEditor.namePlaceholder")}
              value={newListName}
              onChangeText={setNewListName}
              placeholderTextColor={colors.secondaryText}
              clearButtonMode="always"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={[
                { color: colors.text, fontSize: 16, paddingVertical: 8 },
                typography.body,
              ]}
            />
          </View>
        </View>
        <Button
          title={t("create")}
          onPress={handleCreateList}
          disabled={!newListName.trim()}
        />
      </View>
    </TrueSheet>
  );
});

CreateListBottomSheet.displayName = "CreateListBottomSheet";

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
});

export default CreateListBottomSheet;
