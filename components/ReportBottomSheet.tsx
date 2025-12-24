import React, { forwardRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { ReportReason, ResourceType } from "@/types/report";
import { useReportUser, useReportList, useReportReview } from "@/hooks/queries/reports";
import { toast } from "sonner-native";
import { Check, Send } from "lucide-react-native";
import { AxiosError } from "axios";
import Button from "@/components/ui/Button";

export interface ReportBottomSheetProps {
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ReasonOption {
  value: ReportReason;
  labelKey: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  { value: "offensive_content", labelKey: "report.reasons.offensiveContent" },
  { value: "spam", labelKey: "report.reasons.spam" },
  { value: "harassment", labelKey: "report.reasons.harassment" },
  { value: "other", labelKey: "report.reasons.other" },
];

interface ReasonButtonProps {
  option: ReasonOption;
  isSelected: boolean;
  onPress: () => void;
  typography: ReturnType<typeof useTypography>;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ReasonButton({ option, isSelected, onPress, typography, colors }: ReasonButtonProps) {
  const { t } = useTranslation();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isSelected
      ? colors.accent
      : `rgba(128, 128, 128, ${pressed.value * 0.15})`,
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
      style={[styles.reasonButton, animatedStyle]}
    >
      <Text
        style={[
          typography.body,
          { color: isSelected ? "#FFFFFF" : colors.text },
        ]}
      >
        {t(option.labelKey)}
      </Text>
      {isSelected && <Check size={18} strokeWidth={2.5} color="#FFFFFF" />}
    </AnimatedPressable>
  );
}

const ReportBottomSheet = forwardRef<TrueSheet, ReportBottomSheetProps>(
  ({ resourceType, resourceId, resourceName, onDismiss }, ref) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();

    const [selectedReason, setSelectedReason] = useState<ReportReason>("offensive_content");
    const [description, setDescription] = useState("");

    const { mutateAsync: reportUser, isPending: isReportingUser } = useReportUser();
    const { mutateAsync: reportList, isPending: isReportingList } = useReportList();
    const { mutateAsync: reportReview, isPending: isReportingReview } = useReportReview();

    const isSubmitting = isReportingUser || isReportingList || isReportingReview;

    const closeSheet = useCallback(() => {
      const sheetRef = typeof ref === "object" ? ref?.current : null;
      sheetRef?.dismiss();
    }, [ref]);

    const handleDismiss = useCallback(() => {
      setSelectedReason("offensive_content");
      setDescription("");
      onDismiss?.();
    }, [onDismiss]);

    const handleSubmit = async () => {
      try {
        if (resourceType === "user") {
          await reportUser({
            userId: resourceId,
            reason: selectedReason,
            description: description.trim() || undefined,
          });
        } else if (resourceType === "list") {
          await reportList({
            listId: resourceId,
            reason: selectedReason,
            description: description.trim() || undefined,
          });
        } else if (resourceType === "review") {
          await reportReview({
            reviewId: resourceId,
            reason: selectedReason,
            description: description.trim() || undefined,
          });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(t("report.success"));
        closeSheet();
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const axiosError = error as AxiosError<{ code?: string }>;
        const errorCode = axiosError.response?.data?.code;

        if (errorCode === "DUPLICATE_REPORT") {
          toast.error(t("report.errors.duplicate"));
        } else if (errorCode === "INVALID_INPUT") {
          toast.error(t("report.errors.invalidInput"));
        } else {
          toast.error(t("report.errors.generic"));
        }
      }
    };

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        backgroundColor={colors.background}
        grabber={false}
        onDidDismiss={handleDismiss}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <Pressable style={styles.content} onPress={Keyboard.dismiss}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[typography.categoryTitle, { color: colors.text }]}>
                {t("report.title")}
              </Text>
              {resourceName && (
                <Text
                  style={[typography.bodyCaption, { color: colors.secondaryText, marginTop: 4 }]}
                  numberOfLines={1}
                >
                  {resourceType === "user"
                    ? t("report.reportingUser", { name: resourceName })
                    : resourceType === "list"
                      ? t("report.reportingList", { name: resourceName })
                      : t("report.reportingReview", { name: resourceName })}
                </Text>
              )}
            </View>

            {/* Reason Selection */}
            <View style={styles.reasonsSection}>
              <Text
                style={[
                  typography.bodyCaption,
                  { color: colors.secondaryText, marginBottom: 12 },
                ]}
              >
                {t("report.selectReason")}
              </Text>
              <View style={styles.reasonsContainer}>
                {REASON_OPTIONS.map((option) => (
                  <ReasonButton
                    key={option.value}
                    option={option}
                    isSelected={selectedReason === option.value}
                    onPress={() => setSelectedReason(option.value)}
                    typography={typography}
                    colors={colors}
                  />
                ))}
              </View>
            </View>

            {/* Description Input */}
            <TextInput
              style={[
                styles.textInput,
                typography.body,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("report.descriptionPlaceholder")}
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            {/* Character count */}
            <Text style={[typography.bodyCaption, styles.charCount, { color: colors.secondaryText }]}>
              {description.length}/1000
            </Text>

            {/* Submit Button */}
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : (
              <Button
                title={t("report.submit")}
                onPress={handleSubmit}
                icon={<Send size={18} color="#fff" />}
                iconPosition="left"
                style={styles.submitButton}
              />
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </TrueSheet>
    );
  }
);

ReportBottomSheet.displayName = "ReportBottomSheet";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  reasonsSection: {
    marginBottom: 16,
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  textInput: {
    minHeight: 120,
    maxHeight: 200,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  charCount: {
    textAlign: "right",
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 16,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default ReportBottomSheet;

