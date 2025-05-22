/* eslint-disable react/display-name */
import React, {
  forwardRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { LegendList } from "@legendapp/list";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  withTiming,
  withSpring,
  EntryAnimationsValues,
  ExitAnimationsValues,
} from "react-native-reanimated";
import { Book, ReadingStatus, List } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Star,
  StarHalf,
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
} from "lucide-react-native";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useListStore } from "@/stores/listStore";
import CollectionListElement from "./CollectionListElement";
import Button from "./ui/Button";
import SecondaryButton from "./ui/SecondaryButton";
interface BookActionsBottomSheetProps {
  book: Book;
  snapPoints?: string[];
  index?: number;
  onDismiss?: () => void;
  backdropDismiss?: boolean;
  view?: "actions" | "status_editor" | "note_editor" | "list_editor" | "list_creator";
}

const VIEW_ACTIONS = "actions";
const VIEW_STATUS_EDITOR = "status_editor";
const VIEW_NOTE_EDITOR = "note_editor";
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
    transform: [{ scale: withSpring(1, { damping: 12, stiffness: 100 }) }],
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
    },
    ref
  ) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const {
      isBookTracked,
      updateTrackedBook,
      removeTrackedBook,
      addTrackedBook,
    } = useTrackedBooksStore();
    const {
      myListsById,
      myListsIds,
      fetchMyLists,
      createList,
      addBookToList,
      isLoading: isListsLoading,
    } = useListStore();
    const lists = myListsIds.map((id) => myListsById[id]);
    const isTracking = isBookTracked(book.id);
    const [currentView, setCurrentView] = useState(view);
    const [newListName, setNewListName] = useState("");

    useEffect(() => {
      if (view) {
        setCurrentView(view);
      }
    }, [view]);

    // Fetch lists when entering list editor or creator
    useEffect(() => {
      if (
        currentView === VIEW_LIST_EDITOR ||
        currentView === VIEW_LIST_CREATOR
      ) {
        fetchMyLists();
      }
    }, [currentView, fetchMyLists]);

    const handleDismiss = () => {
      setCurrentView(view); // Reset to default view on dismiss
      setNewListName(""); // Clear the input
      if (onDismiss) {
        onDismiss();
      }
    };

    const handleCreateList = async () => {
      if (!newListName.trim()) return; // Prevent creating empty lists
      console.log("lists before createList", myListsById);
      const newList = await createList(newListName.trim());
      console.log("lists after createList (from store return)", newList);
      if (newList) {
        await addBookToList(newList.id, book.id);
      }
      setNewListName("");
      handleDismiss();
    };

    const actions = [
      {
        label: "Ajouter à ma bibliothèque",
        icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: !isTracking,
        onPress: () => handleAddBookToTracking(),
      },
      {
        label: "Modifier le statut",
        icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: isTracking,
        onPress: () => setCurrentView(VIEW_STATUS_EDITOR),
      },
      {
        label: "Supprimer de ma bibliothèque",
        icon: <MinusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: isTracking,
        onPress: () => handleRemoveBookFromTracking(),
      },
      {
        label: "Ajouter à une liste",
        icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: true,
        onPress: () => {
          setCurrentView(VIEW_LIST_EDITOR);
        },
      },
      {
        label: "Noter",
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: true,
        onPress: () => setCurrentView(VIEW_NOTE_EDITOR),
      },
      {
        label: "Changer de couverture",
        icon: (
          <BookImageIcon size={16} strokeWidth={2.75} color={colors.text} />
        ),
        show: true,
      },
      {
        label: "Partager",
        icon: <ShareIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: true,
      },
    ];

    const statusOptions = [
      {
        label: "En cours",
        icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("reading"),
      },
      {
        label: "A lire",
        icon: <Clock3 size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("plan_to_read"),
      },
      {
        label: "Complété",
        icon: <BookCheck size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("completed"),
      },
      {
        label: "En pause",
        icon: <Pause size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("on_hold"),
      },
      {
        label: "Abandonné",
        icon: <Square size={16} strokeWidth={2.75} color={colors.text} />,
        onPress: () => updateStatus("dropped"),
      },
    ];

    useEffect(() => {
      if (view) {
        setCurrentView(view);
      }
    }, [view]);

    const updateStatus = async (status: ReadingStatus) => {
      await updateTrackedBook(book.id, { status });
    };

    const handleAddBookToTracking = async () => {
      await addTrackedBook(book);
    };

    const handleRemoveBookFromTracking = async () => {
      await removeTrackedBook(book.id);
    };

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

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        index={index}
        onDismiss={handleDismiss}
        backgroundStyle={{
          backgroundColor: colors.card,
          borderRadius: 25,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.icon }}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {currentView === VIEW_ACTIONS && (
            <Animated.View entering={morphIn} exiting={morphOut}>
              <View>
                <View style={styles.bottomSheetHeader}>
                  <Image
                    source={{ uri: book.cover_image }}
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
                      {book.author}
                    </Text>
                    <View style={[styles.ratingContainer, { marginTop: 4 }]}>
                      <Ionicons name="star" size={14} color={colors.text} />
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
                  {actions.map(
                    (action, idx) =>
                      action.show && (
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
                      )
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
                  Modifier le statut
                </Text>
              </View>
              <View style={styles.bottomSheetActions}>
                {statusOptions.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.actionButton },
                    ]}
                    onPress={() => option.onPress()}
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
                  Ajouter à une liste
                </Text>
              </View>
              <View>
                <SecondaryButton
                  title="Créer une liste"
                  onPress={() => {
                    setCurrentView(VIEW_LIST_CREATOR);
                  }}
                  style={{ marginBottom: 16 }}
                />
              </View>
              {/* Liste des listes */}
              <View style={{ height: 380 }}>
                <LegendList
                  data={lists}
                  renderItem={({ item }) => (
                    <CollectionListElement list={item} onPress={() => {}} size="compact" />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  recycleItems
                  contentContainerStyle={{ flexGrow: 1 }}
                />
              </View>
              <Button title="Ajouter" onPress={() => {}} style={{ marginTop: 64 }} />
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
                  Créer une nouvelle liste
                </Text>
              </View>
              <View style={{ marginBottom: 16 }}>
                <View style={{
                  backgroundColor: colors.background,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}>
                  <BottomSheetTextInput
                    placeholder="Nom de la liste"
                    value={newListName}
                    onChangeText={setNewListName}
                    placeholderTextColor={colors.secondaryText}
                    clearButtonMode="always"
                    style={[{ color: colors.text, fontSize: 16, paddingVertical: 8 }, typography.body]}
                  />
                </View>
              </View>
              <Button
                title="Créer la liste"
                onPress={handleCreateList}
                disabled={!newListName.trim()}
              />
            </Animated.View>
          )}

          {currentView === VIEW_NOTE_EDITOR && (
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
                <Star size={52} color={colors.text} strokeWidth={0.75} />
                <Star size={52} color={colors.text} strokeWidth={0.75} />
                <Star size={52} color={colors.text} strokeWidth={0.75} />
                <Star size={52} color={colors.text} strokeWidth={0.75} />
                <Star size={52} color={colors.text} strokeWidth={0.75} />
              </View>
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
    padding: 16,
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
    marginBottom: 64,
  },
});

export default BookActionsBottomSheet;
