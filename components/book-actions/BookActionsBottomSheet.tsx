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
  Pin,
  PinOff,
  BookMarked,
} from "lucide-react-native";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useUserStore } from "@/stores/userStore";
import { useRemoveBookFromList } from "@/hooks/queries/lists";
import {
  useAddBookToFavorites,
  useRemoveBookFromFavorites,
  useUserTop,
  usePinnedBook,
  usePinBook,
  useUnpinBook,
} from "@/hooks/queries/users";
import { useTrackrPlus } from "@/hooks/useTrackrPlus";
import { toast } from "sonner-native";
import { handleErrorCodes } from "@/utils/handleErrorCodes";
import PlusBadge from "@/components/ui/PlusBadge";

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
    isPremium?: boolean;
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
        {action.isPremium && <PlusBadge />}
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
      getTrackedBookStatus,
      togglePinInLibrary,
    } = useTrackedBooksStore();
    const { mutateAsync: removeBookFromList } = useRemoveBookFromList();
    const { mutateAsync: addBookToFavorites } = useAddBookToFavorites();
    const { mutateAsync: removeBookFromFavorites } =
      useRemoveBookFromFavorites();
    const { data: favoriteBooks } = useUserTop();
    const { data: pinnedBookData } = usePinnedBook();
    const { mutateAsync: pinBook } = usePinBook();
    const { mutateAsync: unpinBook } = useUnpinBook();
    const { presentPaywall } = useTrackrPlus();
    const { currentUser } = useUserStore();

    // Use DB plan for badge display (not RevenueCat)
    const hasTrackrPlus = currentUser?.plan === "plus";

    const isTracking = isBookTracked(book.id);
    const trackingStatus = getTrackedBookStatus(book.id);
    const isPinnedInLibrary = trackingStatus?.isPinnedInLibrary ?? false;
    const isFavorited = useMemo(
      () =>
        favoriteBooks?.some((favoriteBook) => favoriteBook.id === book.id) ??
        false,
      [favoriteBooks, book.id]
    );
    const isPinned = useMemo(
      () => pinnedBookData?.book?.id === book.id,
      [pinnedBookData?.book?.id, book.id]
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

    const handlePinBook = useCallback(async () => {
      closeSheet();
      try {
        await pinBook(book.id);
        toast(t("toast.bookPinned"));
      } catch (error: any) {
        console.error("Pin book error:", error);
        // If user doesn't have Plus, show paywall
        const errorCode = error?.response?.data?.code;
        if (errorCode === "USER_PLUS_REQUIRED") {
          setTimeout(() => {
            presentPaywall();
          }, 300);
        } else {
          toast.error(t(handleErrorCodes(error)));
        }
      }
    }, [book.id, closeSheet, presentPaywall, pinBook, t]);

    const handleUnpinBook = useCallback(async () => {
      closeSheet();
      try {
        await unpinBook();
        toast(t("toast.bookUnpinned"));
      } catch (error) {
        console.error("Unpin book error:", error);
        toast.error(t(handleErrorCodes(error)));
      }
    }, [closeSheet, unpinBook, t]);

    const handleTogglePinInLibrary = useCallback(async () => {
      closeSheet();
      try {
        await togglePinInLibrary(book.id);
        if (isPinnedInLibrary) {
          toast(t("toast.bookUnpinnedFromLibrary"));
        } else {
          toast(t("toast.bookPinnedInLibrary"));
        }
      } catch (error) {
        console.error("Toggle pin in library error:", error);
        toast.error(t(handleErrorCodes(error)));
      }
    }, [book.id, closeSheet, isPinnedInLibrary, togglePinInLibrary, t]);

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
        label: t("bookBottomSheet.pinToHome"),
        icon: <Pin size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: false,
        show: !isPinned && isTracking,
        isPremium: !hasTrackrPlus,
        onPress: handlePinBook,
      },
      {
        label: t("bookBottomSheet.unpinFromHome"),
        icon: <PinOff size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: false,
        show: isPinned,
        onPress: handleUnpinBook,
      },
      {
        label: isPinnedInLibrary
          ? t("bookBottomSheet.unpinFromLibrary")
          : t("bookBottomSheet.pinInLibrary"),
        icon: <BookMarked size={16} strokeWidth={2.75} color={colors.text} />,
        seeMore: false,
        show: isTracking,
        onPress: handleTogglePinInLibrary,
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
