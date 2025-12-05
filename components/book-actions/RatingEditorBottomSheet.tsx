import React, { forwardRef, useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Book } from "@/types/book";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import RatingSlider from "@/components/ui/RatingSlider";
import Button from "@/components/ui/Button";

export interface RatingEditorBottomSheetProps {
  book: Book;
  onDismiss?: () => void;
  onRatingUpdated?: (rating: number | null) => void;
}

const RatingEditorBottomSheet = forwardRef<
  TrueSheet,
  RatingEditorBottomSheetProps
>(({ book, onDismiss, onRatingUpdated }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();
  const { getTrackedBookStatus, updateTrackedBook, addTrackedBook, isBookTracked } =
    useTrackedBooksStore();
  const [tempRating, setTempRating] = useState<number>(0);

  useEffect(() => {
    const trackedStatus = getTrackedBookStatus(book.id);
    const rating = trackedStatus?.rating;
    setTempRating(typeof rating === "number" ? rating : 0);
  }, [book.id, getTrackedBookStatus]);

  const closeSheet = useCallback(() => {
    const sheetRef = typeof ref === "object" ? ref?.current : null;
    if (sheetRef) {
      sheetRef.dismiss();
    }
  }, [ref]);

  const handleSheetDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const handleSaveRating = async () => {
    try {
      // If book is not tracked, add it first
      if (!isBookTracked(book.id)) {
        await addTrackedBook(book);
      }

      const ratingValue = tempRating === 0 ? null : tempRating;
      await updateTrackedBook(book.id, { rating: ratingValue });
      onRatingUpdated?.(ratingValue);
      closeSheet();
    } catch (error) {
      console.error("Error saving rating:", error);
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
            {t("bookBottomSheet.rateBook")}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <RatingSlider
            key={`rating-${book.id}`}
            bookId={book.id}
            onValueChange={setTempRating}
            showValue={true}
          />
        </View>
        <Button
          title={t("bookBottomSheet.saveRating")}
          onPress={handleSaveRating}
          style={{ marginTop: 36 }}
        />
      </View>
    </TrueSheet>
  );
});

RatingEditorBottomSheet.displayName = "RatingEditorBottomSheet";

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
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});

export default RatingEditorBottomSheet;
