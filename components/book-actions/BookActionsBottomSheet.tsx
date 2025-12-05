import React, { forwardRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Book } from "@/types/book";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
  PlusIcon,
  ShareIcon,
  StarIcon,
  MinusIcon,
  BookOpenIcon,
  HeartIcon,
  HeartMinusIcon,
  ChevronRight,
} from "lucide-react-native";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useRemoveBookFromList } from "@/hooks/queries/lists";
import {
  useAddBookToFavorites,
  useRemoveBookFromFavorites,
  useUserTop,
} from "@/hooks/queries/users";
import { toast } from "sonner-native";
import { handleErrorCodes } from "@/utils/handleErrorCodes";

export interface BookActionsBottomSheetProps {
  book: Book;
  onDismiss?: () => void;
  currentListId?: string;
  isFromListPage?: boolean;
  onEditStatusPress?: () => void;
  onRatePress?: () => void;
  onAddToListPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  action: {
    label: string;
    icon: React.ReactNode;
    seeMore?: boolean;
    onPress?: () => void;
  };
  typography: any;
  colors: any;
}

const ActionButton = ({ action, typography, colors }: ActionButtonProps) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(128, 128, 128, ${pressed.value * 0.15})`,
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 100 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 200 });
      }}
      onPress={action.onPress}
      style={[styles.actionButton, animatedStyle]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {action.icon}
        <Text style={[typography.h3, { color: colors.text }]}>
          {action.label}
        </Text>
      </View>
      {action.seeMore && (
        <ChevronRight size={16} strokeWidth={2.75} color={colors.text} />
      )}
    </AnimatedPressable>
  );
};

const BookActionsBottomSheet = forwardRef<
  TrueSheet,
  BookActionsBottomSheetProps
>(
  (
    {
      book,
      onDismiss,
      currentListId,
      isFromListPage,
      onEditStatusPress,
      onRatePress,
      onAddToListPress,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const typography = useTypography();
    const {
      isBookTracked,
      removeTrackedBook,
      addTrackedBook,
    } = useTrackedBooksStore();
    const { mutateAsync: removeBookFromList } = useRemoveBookFromList();
    const { mutateAsync: addBookToFavorites } = useAddBookToFavorites();
    const { mutateAsync: removeBookFromFavorites } =
      useRemoveBookFromFavorites();
    const { data: favoriteBooks } = useUserTop();

    const isTracking = isBookTracked(book.id);
    const isFavorited = useMemo(
      () =>
        favoriteBooks?.some((favoriteBook) => favoriteBook.id === book.id) ??
        false,
      [favoriteBooks, book.id]
    );

    const closeSheet = useCallback(() => {
      const sheetRef = typeof ref === "object" ? ref?.current : null;
      if (sheetRef) {
        sheetRef.dismiss();
      }
    }, [ref]);

    const handleSheetDismiss = useCallback(() => {
      onDismiss?.();
    }, [onDismiss]);

    const handleAddBookToTracking = async () => {
      try {
        await addTrackedBook(book);
        toast(t("toast.addedToTracking"));
      } catch (error) {
        toast.error(t(handleErrorCodes(error)));
      } finally {
        closeSheet();
      }
    };

    const handleRemoveBookFromTracking = async () => {
      try {
        await removeTrackedBook(book.id);
        toast(t("toast.removedFromTracking"));
      } catch (error) {
        toast.error(t(handleErrorCodes(error)));
      } finally {
        closeSheet();
      }
    };

    const handleAddBookToFavorites = async () => {
      try {
        await addBookToFavorites(book.id);
        toast(t("toast.addedToFavorites"));
      } catch (error) {
        toast.error(t(handleErrorCodes(error)));
      } finally {
        closeSheet();
      }
    };

    const handleRemoveBookFromFavorites = async () => {
      try {
        await removeBookFromFavorites(book.id);
        toast(t("toast.removedFromFavorites"));
      } catch (error) {
        toast.error(t(handleErrorCodes(error)));
      } finally {
        closeSheet();
      }
    };

    const handleRemoveBookFromList = async () => {
      if (currentListId) {
        await removeBookFromList({ listId: currentListId, bookId: book.id });
        toast(t("toast.removedFromList"));
        closeSheet();
      }
    };

    const actions = [
      {
        label: t("bookBottomSheet.addToTracking"),
        icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: false,
        show: !isTracking,
        onPress: handleAddBookToTracking,
      },
      {
        label: t("bookBottomSheet.editStatus"),
        icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: true,
        show: isTracking,
        onPress: () => {
          closeSheet();
          onEditStatusPress?.();
        },
      },
      {
        label: t("bookBottomSheet.addToFavorites"),
        icon: <HeartIcon size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: false,
        show: !isFavorited,
        onPress: handleAddBookToFavorites,
      },
      {
        label: t("bookBottomSheet.removeFromFavorites"),
        icon: (
          <HeartMinusIcon size={16} strokeWidth={2.75} color={colors.text} />
        ),
        seeMore: false,
        show: isFavorited,
        onPress: handleRemoveBookFromFavorites,
      },
      {
        label: t("bookBottomSheet.removeFromTracking"),
        icon: <MinusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: false,
        show: isTracking,
        onPress: handleRemoveBookFromTracking,
      },
      currentListId && isFromListPage
        ? {
            label: t("bookBottomSheet.removeFromList"),
            icon: (
              <MinusIcon size={16} strokeWidth={2.75} color={colors.text} />
            ),
            seeMore: false,
            show: true,
            onPress: handleRemoveBookFromList,
          }
        : null,
      {
        label: t("bookBottomSheet.addToList"),
        icon: <PlusIcon size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: true,
        show: true,
        onPress: () => {
          closeSheet();
          onAddToListPress?.();
        },
      },
      {
        label: t("bookBottomSheet.rate"),
        icon: <StarIcon size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: true,
        show: isTracking,
        onPress: () => {
          closeSheet();
          onRatePress?.();
        },
      },
      {
        label: t("bookBottomSheet.share"),
        icon: <ShareIcon size={16} strokeWidth={2.75} color={colors.text} />,
        show: true,
      },
    ];

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
          <View style={styles.bottomSheetHeader}>
            <Image
              source={{ uri: book.coverImage }}
              style={styles.coverImage}
            />
            <View style={{ flexShrink: 1 }}>
              <Text
                style={[typography.h3, { color: colors.text }]}
                numberOfLines={2}
              >
                {book.title}
              </Text>
              <Text
                style={[typography.caption, { color: colors.secondaryText }]}
                numberOfLines={1}
              >
                {book.type === "comic"
                  ? book.publishers?.map((publisher) => publisher.name).join(", ")
                  : book.authors?.map((author) => author.name).join(", ")}
              </Text>
              <View style={[styles.ratingContainer, { marginTop: 4 }]}>
                <Ionicons name="star" size={14} color={colors.secondaryText} />
                <Text
                  style={[typography.caption, { color: colors.secondaryText }]}
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
                <ActionButton
                  key={idx}
                  action={action}
                  typography={typography}
                  colors={colors}
                />
              ) : null
            )}
          </View>
        </View>
      </TrueSheet>
    );
  }
);

BookActionsBottomSheet.displayName = "BookActionsBottomSheet";

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  coverImage: {
    width: 60,
    height: 60 * 1.5,
    borderRadius: 6,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomSheetActions: {
    flexDirection: "column",
    gap: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
});

export default BookActionsBottomSheet;
