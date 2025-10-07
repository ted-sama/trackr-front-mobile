/* eslint-disable react/display-name */
import React, {
  forwardRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import Animated, {
  withTiming,
  withSpring,
  EntryAnimationsValues,
  ExitAnimationsValues,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Book } from "@/types/book";
import { ReadingStatus } from "@/types/reading-status";
// import { List } from "@/types/list";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
  PlusIcon,
  ShareIcon,
  StarIcon,
  BookImageIcon,
  MinusIcon,
  Clock3,
  BookOpenIcon,
  BookCheck,
  Pause,
  Square,
  HeartIcon,
  HeartMinusIcon,
} from "lucide-react-native";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import {
  useMyLists,
  useAddBookToList,
  useRemoveBookFromList,
  useCreateList,
} from "@/hooks/queries/lists";
import {
  useAddBookToFavorites,
  useRemoveBookFromFavorites,
  useUserTop,
} from "@/hooks/queries/users";
import { hexToRgba } from "@/utils/colors";
import Toast from "react-native-toast-message";
import CollectionListElement from "./CollectionListElement";
import Button from "./ui/Button";
import SecondaryButton from "./ui/SecondaryButton";
import RatingSlider from "./ui/RatingSlider";
import { handleErrorCodes } from "@/utils/handleErrorCodes";

export interface BookActionsBottomSheetProps {
  book: Book;
  snapPoints?: string[];
  index?: number;
  onDismiss?: () => void;
  backdropDismiss?: boolean;
  view?:
    | "actions"
    | "status_editor"
    | "rating_editor"
    | "list_editor"
    | "list_creator";
  currentListId?: string;
  isFromListPage?: boolean;
}

const VIEW_ACTIONS = "actions";
const VIEW_STATUS_EDITOR = "status_editor";
const VIEW_RATING_EDITOR = "rating_editor";
const VIEW_LIST_EDITOR = "list_editor";
const VIEW_LIST_CREATOR = "list_creator";
// Custom morphing animations
function morphIn(values: EntryAnimationsValues) {
  "worklet";
  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.8 }],
    borderRadius: values.targetBorderRadius ?? 25,
  };
  const animations = {
    opacity: withTiming(1, { duration: 300 }),
    transform: [{ scale: withSpring(1, { damping: 500, stiffness: 900 }) }],
    borderRadius: withTiming(0, { duration: 300 }),
  };
  return { initialValues, animations };
}
function morphOut(values: ExitAnimationsValues) {
  "worklet";
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
    borderRadius: values.currentBorderRadius,
  };
  const animations = {
    opacity: withTiming(0, { duration: 200 }),
    transform: [{ scale: withSpring(0.8, { damping: 12, stiffness: 100 }) }],
    borderRadius: withTiming(values.currentBorderRadius, { duration: 200 }),
  };
  return { initialValues, animations };
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

const BookActionsBottomSheet = forwardRef<
  BottomSheetModal,
  BookActionsBottomSheetProps
>(
  (
    {
      book,
      snapPoints,
      index,
      onDismiss,
      backdropDismiss,
      view = VIEW_ACTIONS,
      currentListId,
      isFromListPage,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const typography = useTypography();
    const {
      isBookTracked,
      getTrackedBookStatus,
      updateTrackedBook,
      removeTrackedBook,
      addTrackedBook,
    } = useTrackedBooksStore();
    const { data: myListsData } = useMyLists();
    const { mutateAsync: addBookToList } = useAddBookToList();
    const { mutateAsync: removeBookFromList } = useRemoveBookFromList();
    const { mutateAsync: createList } = useCreateList();
    const { mutateAsync: addBookToFavorites } = useAddBookToFavorites();
    const { mutateAsync: removeBookFromFavorites } =
      useRemoveBookFromFavorites();
    const { data: favoriteBooks } = useUserTop();
    const lists = useMemo(
      () =>
        (myListsData?.pages.flatMap((page: any) => page.data) ?? []) as any[],
      [myListsData]
    );
    const isTracking = isBookTracked(book.id);
    const isFavorited = useMemo(
      () =>
        favoriteBooks?.some((favoriteBook) => favoriteBook.id === book.id) ??
        false,
      [favoriteBooks, book.id]
    );
    const [currentView, setCurrentView] = useState(view);
    const [newListName, setNewListName] = useState("");
    const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
    const [initialListIds, setInitialListIds] = useState<string[]>([]);
    const [tempStatus, setTempStatus] = useState<ReadingStatus>();
    const [tempRating, setTempRating] = useState<number>(0);

    // Synchronize currentView with the view prop whenever it changes
    useEffect(() => {
      setCurrentView(view);
    }, [view]);

    const resetSheetState = useCallback(() => {
      setCurrentView(view);
      setNewListName("");
      setSelectedListIds([]);
      setInitialListIds([]);
    }, [view]);

    const closeSheet = useCallback(() => {
      resetSheetState();
      const sheetRef = typeof ref === "object" ? ref?.current : null;
      if (sheetRef) {
        // @ts-expect-error bottom sheet ref
        sheetRef.dismiss();
      }
    }, [ref, resetSheetState]);

    const handleSheetDismiss = useCallback(() => {
      resetSheetState();
      if (onDismiss) {
        onDismiss();
      }
    }, [onDismiss, resetSheetState]);

    // Load lists containing the book when entering list editor
    useEffect(() => {
      if (currentView === VIEW_LIST_EDITOR) {
        // Without a direct endpoint in hooks, infer selected lists from lists containing the book if available in list data
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
      }
    }, [currentView, book.id, lists]);

    // Synchronise tempStatus et tempRating avec trackedStatus à chaque changement
    useEffect(() => {
      const trackedStatus = getTrackedBookStatus(book.id);
      setTempStatus(trackedStatus?.status || "plan_to_read");
      const rating = trackedStatus?.rating;
      // Toujours synchroniser avec la note réelle de la base de données
      setTempRating(typeof rating === "number" ? rating : 0);
    }, [book.id, getTrackedBookStatus]);

    const handleCreateList = async () => {
      try {
        await createList(newListName);
        setNewListName("");
        setCurrentView(VIEW_LIST_EDITOR);
      } catch (error) {
        console.error("Error creating list:", error);
      }
    };

    const actions = [
      {
        label: t("bookBottomSheet.addToTracking"),
        icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: !isTracking,
        onPress: () => handleAddBookToTracking(),
      },
      {
        label: t("bookBottomSheet.editStatus"),
        icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: isTracking,
        onPress: () => setCurrentView(VIEW_STATUS_EDITOR),
      },
      {
        label: t("bookBottomSheet.addToFavorites"),
        icon: <HeartIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: !isFavorited,
        onPress: () => handleAddBookToFavorites(),
      },
      {
        label: t("bookBottomSheet.removeFromFavorites"),
        icon: (
          <HeartMinusIcon size={16} strokeWidth={2.75} color={colors.text} />
        ),
        show: isFavorited,
        onPress: () => handleRemoveBookFromFavorites(),
      },
      {
        label: t("bookBottomSheet.removeFromTracking"),
        icon: <MinusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: isTracking,
        onPress: () => handleRemoveBookFromTracking(),
      },
      // Remove-from-list action is only shown on list page and when a listId is provided
      currentListId && isFromListPage
        ? {
            label: t("bookBottomSheet.removeFromList"),
            icon: (
              <MinusIcon size={16} strokeWidth={2.75} color={colors.text} />
            ),
            show: true,
            onPress: () => handleRemoveBookFromList(),
          }
        : null,
      {
        label: t("bookBottomSheet.addToList"),
        icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: true,
        onPress: () => {
          setCurrentView(VIEW_LIST_EDITOR);
        },
      },
      {
        label: t("bookBottomSheet.rate"),
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: isTracking,
        onPress: () => setCurrentView(VIEW_RATING_EDITOR),
      },
      {
        label: t("bookBottomSheet.changeCover"),
        icon: (
          <BookImageIcon size={16} strokeWidth={2.75} color={colors.text} />
        ),
        show: true,
      },
      {
        label: t("bookBottomSheet.share"),
        icon: <ShareIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: true,
      },
    ];

    const statusOptions = [
      {
        status: "reading",
        label: t("status.reading"),
        icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("reading"),
      },
      {
        status: "plan_to_read",
        label: t("status.planToRead"),
        icon: <Clock3 size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("plan_to_read"),
      },
      {
        status: "completed",
        label: t("status.completed"),
        icon: <BookCheck size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("completed"),
      },
      {
        status: "on_hold",
        label: t("status.onHold"),
        icon: <Pause size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("on_hold"),
      },
      {
        status: "dropped",
        label: t("status.dropped"),
        icon: <Square size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("dropped"),
      },
    ];

    const updateStatus = async (status: ReadingStatus) => {
      try {
        setTempStatus(status);
        await updateTrackedBook(book.id, { status });
        // Optional: Add a small delay to ensure UI updates properly
        setTimeout(() => {
          closeSheet();
        }, 100);
      } catch (error) {
        console.error("Error updating book status:", error);
        // Revert temp status on error
        const currentStatus = getTrackedBookStatus(book.id);
        setTempStatus(currentStatus?.status || "plan_to_read");
      }
    };

    const handleAddBookToTracking = async () => {
      try {
        await addTrackedBook(book);
        Toast.show({ type: "info", text1: t("toast.addedToTracking") });
      } catch (error) {
        Toast.show({ type: "info", text1: t(handleErrorCodes(error)) });
      } finally {
        closeSheet();
      }
    };

    const handleRemoveBookFromTracking = async () => {
      try {
        await removeTrackedBook(book.id);
        Toast.show({ type: "info", text1: t("toast.removedFromTracking") });
      } catch (error) {
        Toast.show({ type: "info", text1: t(handleErrorCodes(error)) });
      } finally {
        closeSheet();
      }
    };

    const handleAddBookToFavorites = async () => {
      try {
        await addBookToFavorites(book.id);
        Toast.show({ type: "info", text1: t("toast.addedToFavorites") });
      } catch (error) {
        Toast.show({ type: "info", text1: t(handleErrorCodes(error)) });
      } finally {
        closeSheet();
      }
    };

    const handleRemoveBookFromFavorites = async () => {
      try {
        await removeBookFromFavorites(book.id);
        Toast.show({ type: "info", text1: t("toast.removedFromFavorites") });
      } catch (error) {
        Toast.show({ type: "info", text1: t(handleErrorCodes(error)) });
      } finally {
        closeSheet();
      }
    };

    const handleRemoveBookFromList = async () => {
      if (currentListId) {
        await removeBookFromList({ listId: currentListId, bookId: book.id });
        closeSheet();
        Toast.show({ type: "info", text1: "Livre retiré de la liste" });
      }
    };

    function toggleListSelection(listId: string) {
      setSelectedListIds((prev) =>
        prev.includes(listId)
          ? prev.filter((id) => id !== listId)
          : [...prev, listId]
      );
    }

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={backdropDismiss ? "close" : "none"}
        />
      ),
      [backdropDismiss]
    );

    const handleSaveRating = async () => {
      // If book is not tracked, add it first
      if (!isTracking) {
        await addTrackedBook(book);
      }

      // Update the book with the new rating
      await updateTrackedBook(book.id, { rating: tempRating });
      closeSheet();
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        index={index}
        onDismiss={handleSheetDismiss}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderCurve: "continuous",
          borderRadius: 30,
        }}
        handleComponent={null}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {currentView === VIEW_ACTIONS && (
            <Animated.View entering={morphIn} exiting={morphOut}>
              <View>
                <View style={styles.bottomSheetHeader}>
                  <Image
                    source={{ uri: book.coverImage }}
                    style={{
                      width: 60,
                      height: 60 * 1.5,
                      borderRadius: 6,
                      marginBottom: 10,
                    }}
                  />
                  <View style={{ flexShrink: 1 }}>
                    <Text
                      style={[typography.h3, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {book.title}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.secondaryText },
                      ]}
                      numberOfLines={1}
                    >
                      {book.authors?.map((author) => author.name).join(", ")}
                    </Text>
                    <View style={[styles.ratingContainer, { marginTop: 4 }]}>
                      <Ionicons
                        name="star"
                        size={14}
                        color={colors.secondaryText}
                      />
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {" "}
                        {book.rating || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.bottomSheetActions}>
                  {actions.filter(Boolean).map((action: any, idx) =>
                    action.show ? (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.actionButton },
                        ]}
                        onPress={action.onPress}
                      >
                        {action.icon}
                        <Text
                          style={[typography.caption, { color: colors.text }]}
                        >
                          {action.label}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {currentView === VIEW_STATUS_EDITOR && (
            <Animated.View entering={morphIn} exiting={morphOut}>
              <View style={styles.subMenuHeader}>
                <TouchableOpacity
                  onPress={() => setCurrentView(VIEW_ACTIONS)}
                  style={[
                    styles.backButton,
                    { backgroundColor: colors.backButtonBackground },
                  ]}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text
                  style={[
                    typography.categoryTitle,
                    { color: colors.text, textAlign: "center" },
                  ]}
                >
                  {t("bookBottomSheet.editStatus")}
                </Text>
              </View>
              <View style={styles.bottomSheetActions}>
                {statusOptions.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.actionButton },
                      { opacity: tempStatus === option.status ? 0.5 : 1 },
                    ]}
                    disabled={tempStatus === option.status}
                    onPress={option.onPress}
                  >
                    {option.icon}
                    <Text style={[typography.caption, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {currentView === VIEW_LIST_EDITOR && (
            <Animated.View entering={morphIn} exiting={morphOut}>
              <View style={styles.subMenuHeader}>
                <TouchableOpacity
                  onPress={() => setCurrentView(VIEW_ACTIONS)}
                  style={[
                    styles.backButton,
                    { backgroundColor: colors.backButtonBackground },
                  ]}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.icon} />
                </TouchableOpacity>
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
                    setCurrentView(VIEW_LIST_CREATOR);
                  }}
                  style={{ marginBottom: 16 }}
                />
              </View>
              {/* Liste des listes */}
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
                      ItemSeparatorComponent={() => (
                        <View style={{ height: 12 }} />
                      )}
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
                  <Text style={[typography.body, { color: colors.secondaryText, textAlign: "center" }]}>{t("bookBottomSheet.listEditor.noListsFound")}</Text>
                )}
              </View>
              <Button
                title={t("save")}
                onPress={async () => {
                  // Determine which lists to add to and which to remove from
                  const listsToAdd = selectedListIds.filter(
                    (id) => !initialListIds.includes(id)
                  );
                  const listsToRemove = initialListIds.filter(
                    (id) => !selectedListIds.includes(id)
                  );

                  try {
                    // Add book to new lists
                    await Promise.all(
                      listsToAdd.map((listId) =>
                        addBookToList({ listId, bookId: book.id })
                      )
                    );

                    // Remove book from unchecked lists
                    await Promise.all(
                      listsToRemove.map((listId) =>
                        removeBookFromList({ listId, bookId: book.id })
                      )
                    );

                    closeSheet();
                  } catch (error) {
                    console.error(
                      "Erreur lors de la sauvegarde des listes:",
                      error
                    );
                  }
                }}
                style={{ marginTop: 36 }}
              />
            </Animated.View>
          )}

          {currentView === VIEW_LIST_CREATOR && (
            <Animated.View entering={morphIn} exiting={morphOut}>
              <View style={styles.subMenuHeader}>
                <TouchableOpacity
                  onPress={() => setCurrentView(VIEW_LIST_EDITOR)}
                  style={[
                    styles.backButton,
                    { backgroundColor: colors.backButtonBackground },
                  ]}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.icon} />
                </TouchableOpacity>
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
            </Animated.View>
          )}

          {currentView === VIEW_RATING_EDITOR && (
            <Animated.View entering={morphIn} exiting={morphOut}>
              <View style={styles.subMenuHeader}>
                <TouchableOpacity
                  onPress={() => setCurrentView(VIEW_ACTIONS)}
                  style={[
                    styles.backButton,
                    { backgroundColor: colors.backButtonBackground },
                  ]}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.icon} />
                </TouchableOpacity>
                <Text
                  style={[
                    typography.categoryTitle,
                    { color: colors.text, textAlign: "center" },
                  ]}
                >
                  Noter le livre
                </Text>
              </View>
              <View style={styles.ratingAction}>
                <RatingSlider
                  key={`rating-${book.id}`}
                  bookId={book.id}
                  onValueChange={setTempRating}
                  showValue={true}
                />
              </View>
              <Button
                title="Sauvegarder la note"
                onPress={handleSaveRating}
                style={{ marginTop: 36 }}
              />
            </Animated.View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "transparent",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 64,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  bottomSheetActions: {
    flexDirection: "column",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  subMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 64,
  },
  backButton: {
    position: "absolute",
    left: 0,
    borderRadius: 25,
    padding: 8,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  ratingAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
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

export default BookActionsBottomSheet;
