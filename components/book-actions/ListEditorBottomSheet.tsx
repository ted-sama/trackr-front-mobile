import React, {
  forwardRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { Book } from "@/types/book";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import {
  useAddBookToList,
  useRemoveBookFromList,
} from "@/hooks/queries/lists";
import { useUserCreatedLists } from "@/hooks/queries/users";
import { hexToRgba } from "@/utils/colors";
import { toast } from "sonner-native";
import CollectionListElement from "@/components/CollectionListElement";
import Button from "@/components/ui/Button";
import SecondaryButton from "@/components/ui/SecondaryButton";

export interface ListEditorBottomSheetProps {
  book: Book;
  onDismiss?: () => void;
  onListsUpdated?: () => void;
  onCreateListPress?: () => void;
}

function haveSameIds(previous: string[], next: string[]) {
  if (previous.length !== next.length) {
    return false;
  }
  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== next[index]) {
      return false;
    }
  }
  return true;
}

const ListEditorBottomSheet = forwardRef<
  TrueSheet,
  ListEditorBottomSheetProps
>(({ book, onDismiss, onListsUpdated, onCreateListPress }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();
  const { data: myListsData } = useUserCreatedLists();
  const { mutateAsync: addBookToList } = useAddBookToList();
  const { mutateAsync: removeBookFromList } = useRemoveBookFromList();

  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [initialListIds, setInitialListIds] = useState<string[]>([]);

  const lists = useMemo(
    () =>
      (myListsData?.pages.flatMap((page: any) => page.data) ?? []) as any[],
    [myListsData]
  );

  // Load lists containing the book on mount
  useEffect(() => {
    const inLists = lists
      .filter((list: any) =>
        list.books?.items?.some((bookItem: any) => bookItem.id === book.id)
      )
      .map((list: any) => list.id);

    setSelectedListIds((previous) =>
      haveSameIds(previous, inLists) ? previous : inLists
    );
    setInitialListIds((previous) =>
      haveSameIds(previous, inLists) ? previous : inLists
    );
  }, [book.id, lists]);

  const resetState = useCallback(() => {
    setSelectedListIds([]);
    setInitialListIds([]);
  }, []);

  const closeSheet = useCallback(() => {
    const sheetRef = typeof ref === "object" ? ref?.current : null;
    if (sheetRef) {
      sheetRef.dismiss();
    }
  }, [ref]);

  const handleSheetDismiss = useCallback(() => {
    resetState();
    onDismiss?.();
  }, [onDismiss, resetState]);

  const toggleListSelection = (listId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSave = async () => {
    const listsToAdd = selectedListIds.filter(
      (id) => !initialListIds.includes(id)
    );
    const listsToRemove = initialListIds.filter(
      (id) => !selectedListIds.includes(id)
    );

    try {
      await Promise.all(
        listsToAdd.map((listId) =>
          addBookToList({ listId, bookId: book.id })
        )
      );

      await Promise.all(
        listsToRemove.map((listId) =>
          removeBookFromList({ listId, bookId: book.id })
        )
      );

      if (listsToAdd.length > 0 && listsToRemove.length > 0) {
        toast.success(t("toast.listsUpdated"));
      } else if (listsToAdd.length > 0) {
        toast.success(t("toast.addedToList"));
      } else if (listsToRemove.length > 0) {
        toast.success(t("toast.removedFromList"));
      }

      onListsUpdated?.();
      closeSheet();
    } catch (error) {
      toast.error(t("toast.errorSavingLists"));
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
            {t("bookBottomSheet.listEditor.title")}
          </Text>
        </View>
        <View>
          <SecondaryButton
            title={t("bookBottomSheet.listEditor.createList")}
            onPress={() => {
              closeSheet();
              onCreateListPress?.();
            }}
            style={{ marginBottom: 16 }}
          />
        </View>
        <View style={{ maxHeight: 250 }}>
          {lists.length > 0 ? (
            <>
              <LinearGradient
                colors={[
                  hexToRgba(colors.background, 1),
                  hexToRgba(colors.background, 0),
                ]}
                style={styles.fadeTop}
                pointerEvents="none"
              />
              <FlatList
                data={lists}
                renderItem={({ item }) => (
                  <CollectionListElement
                    list={item}
                    onPress={() => toggleListSelection(item.id)}
                    size="compact"
                    isSelected={selectedListIds.includes(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={{ flexGrow: 1, paddingTop: 12 }}
              />
              <LinearGradient
                colors={[
                  hexToRgba(colors.background, 0),
                  hexToRgba(colors.background, 1),
                ]}
                style={styles.fadeBottom}
                pointerEvents="none"
              />
            </>
          ) : (
            <Text
              style={[
                typography.body,
                { color: colors.secondaryText, textAlign: "center" },
              ]}
            >
              {t("bookBottomSheet.listEditor.noListsFound")}
            </Text>
          )}
        </View>
        <Button
          title={t("save")}
          onPress={handleSave}
          style={{ marginTop: 36 }}
        />
      </View>
    </TrueSheet>
  );
});

ListEditorBottomSheet.displayName = "ListEditorBottomSheet";

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
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 1,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 1,
  },
});

export default ListEditorBottomSheet;
