import React, { forwardRef, useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Book } from "@/types/book";
import { BookTracking, ReadingStatus } from "@/types/reading-status";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useUpdateTracking } from "@/hooks/useUpdateTracking";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StatusButtonProps {
  option: {
    status: ReadingStatus;
    label: string;
    icon: React.ReactNode;
  };
  isSelected: boolean;
  onPress: () => void;
  typography: any;
  colors: any;
}

const StatusButton = ({ option, isSelected, onPress, typography, colors }: StatusButtonProps) => {
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
      onPress={onPress}
      disabled={isSelected}
      style={[
        styles.actionButton,
        animatedStyle,
        { opacity: isSelected ? 0.5 : 1 },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {option.icon}
        <Text style={[typography.h3, { color: colors.text }]}>
          {option.label}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

const StatusEditorBottomSheet = forwardRef<
  TrueSheet,
  StatusEditorBottomSheetProps
>(({ book, onDismiss, onStatusUpdated, onBookCompleted }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();
  const { getTrackedBookStatus } = useTrackedBooksStore();
  const { updateTracking } = useUpdateTracking();
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

      await updateTracking(book.id, updateData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (status === "completed") {
        onBookCompleted?.();
      }

      onStatusUpdated?.(status);

      setTimeout(() => {
        closeSheet();
      }, 100);
    } catch (error) {
      console.error("Error updating book status:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const currentStatus = getTrackedBookStatus(book.id);
      setTempStatus(currentStatus?.status || "plan_to_read");
    }
  };

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
    <TrueSheet
      ref={ref}
      detents={["auto"]}
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
            {t("bookBottomSheet.editStatus")}
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          {statusOptions.map((option, idx) => (
            <StatusButton
              key={idx}
              option={option}
              isSelected={tempStatus === option.status}
              onPress={() => updateStatus(option.status)}
              typography={typography}
              colors={colors}
            />
          ))}
        </View>
      </View>
    </TrueSheet>
  );
});

StatusEditorBottomSheet.displayName = "StatusEditorBottomSheet";

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
  actionsContainer: {
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

export default StatusEditorBottomSheet;
