import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useListStore } from "@/stores/listStore";
import BookDraggableList from "@/components/BookDraggableList";
import { Book } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Check } from "lucide-react-native";

export default function ListOrder() {
  const { listId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const insets = useSafeAreaInsets();

  const list = useListStore(
    (state) =>
      state.listsById[listId as string] ||
      state.myListsById[listId as string] ||
      null
  );
  const fetchList = useListStore((state) => state.fetchList);
  const reorderBooksInListBulk = useListStore(
    (state) => state.reorderBooksInListBulk
  );
  const isLoading = useListStore((state) => state.isLoading);
  const error = useListStore((state) => state.error);

  const [hasChanges, setHasChanges] = useState(false);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [originalBooks, setOriginalBooks] = useState<Book[]>([]);

  // Charger la liste initialement et quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      if (listId) {
        fetchList(listId as string);
      }
    }, [listId, fetchList])
  );

  // Mettre à jour les livres locaux quand la liste change
  React.useEffect(() => {
    if (list?.books) {
      setLocalBooks([...list.books]);
      setOriginalBooks([...list.books]);
      setHasChanges(false); // Reset changes when list reloads
    }
  }, [list?.books]);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        "Modifications non sauvegardées",
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter sans sauvegarder ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Quitter sans sauvegarder",
            style: "destructive",
            onPress: () => router.back(),
          },
          {
            text: "Sauvegarder et quitter",
            onPress: async () => {
              await handleSave();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleDragEnd = useCallback(
    (data: Book[]) => {
      console.log("Drag end - updating local state only");
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
      const bookOrders = localBooks.map((book, index) => ({
        bookId: book.id,
        position: index + 1, // 1-indexed
      }));

      console.log("Saving all changes at once:", {
        listId: parseInt(listId as string),
        bookOrders,
      });

      await reorderBooksInListBulk(parseInt(listId as string), bookOrders);
      console.log("Bulk reorder successful");

      setHasChanges(false);
      setOriginalBooks([...localBooks]); // Update original to reflect saved state

      Alert.alert(
        "Sauvegarde réussie",
        "L'ordre de la liste a été mis à jour.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      Alert.alert(
        "Erreur de sauvegarde",
        "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    }
  };

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <View
          style={[
            styles.header,
            { paddingTop: insets.top, backgroundColor: colors.background },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <View
        style={{
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.backButtonBackground },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: colors.text }]}>
          Ordonner la liste
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, opacity: hasChanges ? 1 : 0.5 },
          ]}
          disabled={!hasChanges || isLoading}
        >
          <Check size={24} color={colors.buttonText} strokeWidth={2.5} />
        </TouchableOpacity>
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
              {list.books?.length || 0} livre
              {list.books?.length === 1 ? "" : "s"}
            </Text>
          </View>
          <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
            Maintenez appuyé sur un élément et faites-le glisser pour
            réorganiser. Les modifications seront sauvegardées quand vous
            appuierez sur le bouton de sauvegarde.
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
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
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
    flex: 1,
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
  },
  changeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
