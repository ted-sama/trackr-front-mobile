import React, { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useList , useReorderBooksInList } from "@/hooks/queries/lists";
import BookDraggableList from "@/components/BookDraggableList";
import { Book } from "@/types/book";
import { Ionicons } from "@expo/vector-icons";
import UnsavedChangesBottomSheet from "@/components/shared/UnsavedChangesBottomSheet";
import { Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "sonner-native";

export default function ListOrder() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const unsavedChangesRef = useRef<TrueSheet>(null);
  const { data: list } = useList(listId as string);
  const { mutateAsync: reorderBooksInList } = useReorderBooksInList();
  const isLoading = false;
  const error = null;

  const [hasChanges, setHasChanges] = useState(false);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [originalBooks, setOriginalBooks] = useState<Book[]>([]);

  // Charger la liste initialement et quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      // Query hook handles caching and refetch
    }, [])
  );

  // Mettre à jour les livres locaux quand la liste change
  React.useEffect(() => {
    if (list?.books) {
      setLocalBooks([...list.books.items]);
      setOriginalBooks([...list.books.items]);
      setHasChanges(false); // Reset changes when list reloads
    }
  }, [list?.books]);

  const handleBack = () => {
    if (hasChanges) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      unsavedChangesRef.current?.present();
    } else {
      router.back();
    }
  };

  const handleDragEnd = useCallback(
    (data: Book[]) => {
      setLocalBooks(data);

      // Vérifier s'il y a vraiment des changements
      const hasActualChanges = data.some(
        (book, index) => originalBooks[index]?.id !== book.id
      );

      setHasChanges(hasActualChanges);
    },
    [originalBooks]
  );

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    try {
      // Créer la liste des nouvelles positions
      const bookOrders = localBooks.map((book) => book.id);

      await reorderBooksInList({ listId: listId as string, positions: bookOrders });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
      setOriginalBooks([...localBooks]);

      router.back();
      toast(t("toast.listUpdated"));
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(t("toast.errorSavingList"));
    }
  };

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.headerContent}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text
              style={[
                typography.h2,
                { color: colors.text, flex: 1, textAlign: "center" },
              ]}
            >
              Liste introuvable
            </Text>
            <View style={styles.saveButton} />
          </View>
        </View>
        <View style={[styles.centerContainer, { paddingTop: 76 }]}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            Liste introuvable
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.tabBarBorder,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.backButtonBackground,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t("list.reorderModal.title")}
        </Text>
        <Pressable
          onPress={handleSave}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.accent,
              opacity: hasChanges ? 1 : 0.5,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
          disabled={!hasChanges || isLoading}
        >
          <Check size={24} color={colors.buttonText} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
            <Text style={[typography.h3, { color: colors.text }]}>
              {list.name}
            </Text>
            <Text style={{ color: colors.secondaryText }}>·</Text>
            <Text style={[typography.h3, { color: colors.text }]}>
              {list.books?.items?.length || 0} {t("list.reorderModal.book")}
              {list.books?.items?.length === 1 ? "" : "s"}
            </Text>
          </View>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
            {t("list.reorderModal.description")}
          </Text>
        </View>

        {error && (
          <View
            style={[styles.errorCard, { backgroundColor: colors.error + "20" }]}
          >
            <Text style={[typography.caption, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.listContainer}>
          <BookDraggableList
            books={localBooks}
            onDragEnd={handleDragEnd}
            showDragHandle={true}
            showPosition={true}
            contentContainerStyle={{
              overflow: "visible",
              marginHorizontal: 16,
              paddingTop: 16, // Add padding to see content behind gradient
            }}
          />
          <LinearGradient
            colors={[
              colors.background,
              `${colors.background}E6`,
              `${colors.background}99`,
              `${colors.background}4D`,
              `${colors.background}00`,
            ]}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            style={styles.fade}
            pointerEvents="none"
          />
        </View>
      </View>

      <UnsavedChangesBottomSheet
        ref={unsavedChangesRef}
        onDiscard={() => router.back()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: "visible",
    padding: 16,
    paddingTop: 24,
    paddingBottom: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  listContainer: {
    marginHorizontal: -16,
    flex: 1,
  },
  fade: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    height: 32,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  changesIndicator: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  }
});
