import React, { forwardRef, useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
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
  BottomSheetModal,
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

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={handleSheetDismiss}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderCurve: "continuous",
        borderRadius: 30,
      }}
      handleComponent={null}
      backdropComponent={renderBackdrop}
      keyboardBlurBehavior="restore"
      enableDynamicSizing
    >
      <BottomSheetView style={styles.bottomSheetContent}>
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
            <BottomSheetTextInput
              placeholder={t("bookBottomSheet.listEditor.namePlaceholder")}
              value={newListName}
              onChangeText={setNewListName}
              placeholderTextColor={colors.secondaryText}
              clearButtonMode="always"
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
      </BottomSheetView>
    </BottomSheetModal>
  );
});

CreateListBottomSheet.displayName = "CreateListBottomSheet";

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 64,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
});

export default CreateListBottomSheet;

