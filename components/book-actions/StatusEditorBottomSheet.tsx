import React, { forwardRef, useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Book } from "@/types/book";
import { BookTracking, ReadingStatus } from "@/types/reading-status";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import {
  BookOpenIcon,
  Clock3,
  BookCheck,
  Pause,
  Square,
} from "lucide-react-native";

export interface StatusEditorBottomSheetProps {
  book: Book;
  onDismiss?: () => void;
  onStatusUpdated?: (status: ReadingStatus) => void;
  onBookCompleted?: () => void;
}

const StatusEditorBottomSheet = forwardRef<
  BottomSheetModal,
  StatusEditorBottomSheetProps
>(({ book, onDismiss, onStatusUpdated, onBookCompleted }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();
  const { getTrackedBookStatus, updateTrackedBook } = useTrackedBooksStore();
  const [tempStatus, setTempStatus] = useState<ReadingStatus>("plan_to_read");

  useEffect(() => {
    const trackedStatus = getTrackedBookStatus(book.id);
    setTempStatus(trackedStatus?.status || "plan_to_read");
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

  const updateStatus = async (status: ReadingStatus) => {
    try {
      setTempStatus(status);

      const updateData: Partial<BookTracking> = { status };
      if (
        status === "completed" &&
        book.chapters !== null &&
        book.chapters !== undefined
      ) {
        updateData.currentChapter = book.chapters;
      }

      await updateTrackedBook(book.id, updateData);

      if (status === "completed") {
        onBookCompleted?.();
      }

      onStatusUpdated?.(status);

      setTimeout(() => {
        closeSheet();
      }, 100);
    } catch (error) {
      console.error("Error updating book status:", error);
      const currentStatus = getTrackedBookStatus(book.id);
      setTempStatus(currentStatus?.status || "plan_to_read");
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const statusOptions = [
    {
      status: "reading" as ReadingStatus,
      label: t("status.reading"),
      icon: <BookOpenIcon size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      status: "plan_to_read" as ReadingStatus,
      label: t("status.planToRead"),
      icon: <Clock3 size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      status: "completed" as ReadingStatus,
      label: t("status.completed"),
      icon: <BookCheck size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      status: "on_hold" as ReadingStatus,
      label: t("status.onHold"),
      icon: <Pause size={16} strokeWidth={2.75} color={colors.text} />,
    },
    {
      status: "dropped" as ReadingStatus,
      label: t("status.dropped"),
      icon: <Square size={16} strokeWidth={2.75} color={colors.text} />,
    },
  ];

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={handleSheetDismiss}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderCurve: "continuous",
        borderRadius: 30,
      }}
      handleComponent={null}
      backdropComponent={renderBackdrop}
      keyboardBlurBehavior="restore"
      enableDynamicSizing
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <View style={styles.header}>
          <Text
            style={[
              typography.categoryTitle,
              { color: colors.text, textAlign: "center" },
            ]}
          >
            {t("bookBottomSheet.editStatus")}
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          {statusOptions.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.actionButton,
                { backgroundColor: colors.actionButton },
                { opacity: tempStatus === option.status ? 0.5 : 1 },
              ]}
              disabled={tempStatus === option.status}
              onPress={() => updateStatus(option.status)}
            >
              {option.icon}
              <Text style={[typography.caption, { color: colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

StatusEditorBottomSheet.displayName = "StatusEditorBottomSheet";

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 64,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  actionsContainer: {
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
});

export default StatusEditorBottomSheet;

