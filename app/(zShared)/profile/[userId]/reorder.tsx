import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import { Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import BookDraggableList from "@/components/BookDraggableList";
import { useUserTop, useReorderUserTop } from "@/hooks/queries/users";
import { Book } from "@/types/book";

export default function ReorderFavoritesModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { data: topBooks, isLoading, error, isFetching } = useUserTop();
  const { mutateAsync: reorderUserTop, isPending } = useReorderUserTop();

  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [originalBooks, setOriginalBooks] = useState<Book[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (topBooks) {
      setLocalBooks([...topBooks]);
      setOriginalBooks([...topBooks]);
      setHasChanges(false);
    }
  }, [topBooks]);

  const loading = useMemo(() => isLoading || isFetching, [isLoading, isFetching]);

  const handleDragEnd = useCallback(
    (books: Book[]) => {
      setLocalBooks(books);
      const hasActualChanges = books.some((book, index) => originalBooks[index]?.id !== book.id);
      setHasChanges(hasActualChanges);
    },
    [originalBooks]
  );

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    try {
      const bookIds = localBooks.map((book) => book.id);
      await reorderUserTop(bookIds);
      setHasChanges(false);
      setOriginalBooks([...localBooks]);
      router.back();
      toast(t("toast.favoritesReordered"));
    } catch (err) {
      toast.error(t("toast.errorSavingFavorites"));
    }
  }, [hasChanges, localBooks, reorderUserTop, router]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      toast(t("toast.changesNotSaved"));
    }
    router.back();
  }, [hasChanges, router]);

  const isSaveDisabled = !hasChanges || isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.tabBarBorder }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={handleBack}
            style={[styles.iconButton, { backgroundColor: colors.backButtonBackground }]}
            accessibilityRole="button"
            accessibilityLabel={t("toast.goBack")}
          >
            <Ionicons name="arrow-back" size={24} color={colors.icon} />
          </Pressable>
          <Text style={[typography.h3, { color: colors.text, flex: 1, textAlign: "center" }]}>{t("profile.reorderModal.title")}</Text>
          <Pressable
            onPress={handleSave}
            disabled={isSaveDisabled}
            style={[styles.iconButton, { backgroundColor: colors.primary, opacity: isSaveDisabled ? 0.5 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t("toast.saveFavorites")}
          >
            <Check size={24} color={colors.buttonText} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}> 
          <Text style={[typography.h3, { color: colors.text }]}>{t("profile.reorderModal.title")}</Text>
          <Text style={[typography.caption, { color: colors.secondaryText, marginTop: 8 }]}>{t("profile.reorderModal.description")}</Text>
        </View>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.error + "20" }]}> 
            <Text style={[typography.caption, { color: colors.error }]}>{t("toast.errorLoadingFavorites")}</Text>
          </View>
        )}

        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              <BookDraggableList
                books={localBooks}
                onDragEnd={handleDragEnd}
                showPosition
                showDragHandle
                contentContainerStyle={{ marginHorizontal: 16, paddingTop: 16 }}
              />
              <LinearGradient
                colors={[colors.background, `${colors.background}00`]}
                style={styles.fade}
                pointerEvents="none"
              />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
    flex: 1,
    marginHorizontal: -16,
  },
  fade: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    height: 48,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});


