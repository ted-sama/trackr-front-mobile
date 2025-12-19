import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import * as Haptics from "expo-haptics";
import SkeletonLoader from "@/components/skeleton-loader/SkeletonLoader";
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
import UnsavedChangesBottomSheet from "@/components/shared/UnsavedChangesBottomSheet";

export default function ReorderFavoritesModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const unsavedChangesRef = useRef<TrueSheet>(null);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
      setOriginalBooks([...localBooks]);
      router.back();
      toast(t("toast.favoritesReordered"));
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(t("toast.errorSavingFavorites"));
    }
  }, [hasChanges, localBooks, reorderUserTop, router]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      unsavedChangesRef.current?.present();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      router.back();
    }
  }, [hasChanges, router]);

  const isSaveDisabled = !hasChanges || isPending;

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
            styles.iconButton,
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
          accessibilityRole="button"
          accessibilityLabel={t("toast.goBack")}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t("profile.reorderModal.title")}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaveDisabled}
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.primary,
              opacity: isSaveDisabled ? 0.5 : 1,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("toast.saveFavorites")}
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
              {t("profile.favorites")}
            </Text>
            <Text style={{ color: colors.secondaryText }}>·</Text>
            <Text style={[typography.h3, { color: colors.text }]}>
              {localBooks.length} {t("common.book")}{localBooks.length === 1 ? "" : "s"}
            </Text>
          </View>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
            {t("profile.reorderModal.description")}
          </Text>
        </View>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.error + "20" }]}> 
            <Text style={[typography.caption, { color: colors.error }]}>{t("toast.errorLoadingFavorites")}</Text>
          </View>
        )}

        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonItem}>
                  <SkeletonLoader width={24} height={24} style={{ borderRadius: 4 }} />
                  <SkeletonLoader width={60} height={90} style={{ borderRadius: 8, marginLeft: 12 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <SkeletonLoader width="80%" height={16} style={{ borderRadius: 4 }} />
                    <SkeletonLoader width="50%" height={14} style={{ borderRadius: 4, marginTop: 6 }} />
                  </View>
                  <SkeletonLoader width={24} height={24} style={{ borderRadius: 4 }} />
                </View>
              ))}
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
            </>
          )}
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
    height: 64,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
});


