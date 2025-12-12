import React, { forwardRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { ReportReason, ResourceType } from "@/types/report";
import { useReportUser, useReportList } from "@/hooks/queries/reports";
import { toast } from "sonner-native";
import { Check } from "lucide-react-native";
import { AxiosError } from "axios";

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

    const isSubmitting = isReportingUser || isReportingList;

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
        } else {
          await reportList({
            listId: resourceId,
            reason: selectedReason,
            description: description.trim() || undefined,
          });
        }
        toast.success(t("report.success"));
        closeSheet();
      } catch (error) {
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

    const pressed = useSharedValue(0);
    const submitAnimatedStyle = useAnimatedStyle(() => ({
      opacity: isSubmitting ? 0.6 : 1,
      transform: [{ scale: 1 - pressed.value * 0.02 }],
    }));

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        cornerRadius={30}
        backgroundColor={colors.background}
        grabber={false}
        onDidDismiss={handleDismiss}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[typography.h2, { color: colors.text }]}>
              {t("report.title")}
            </Text>
            {resourceName && (
              <Text
                style={[typography.body, { color: colors.secondaryText }]}
                numberOfLines={1}
              >
                {resourceType === "user"
                  ? t("report.reportingUser", { name: resourceName })
                  : t("report.reportingList", { name: resourceName })}
              </Text>
            )}
          </View>

          <View style={styles.reasonsSection}>
            <Text
              style={[
                typography.caption,
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

          <View style={styles.descriptionSection}>
            <Text
              style={[
                typography.caption,
                { color: colors.secondaryText, marginBottom: 8 },
              ]}
            >
              {t("report.additionalDetails")}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                typography.body,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t("report.descriptionPlaceholder")}
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text
              style={[
                typography.caption,
                { color: colors.secondaryText, textAlign: "right", marginTop: 4 },
              ]}
            >
              {description.length}/1000
            </Text>
          </View>

          <AnimatedPressable
            onPressIn={() => {
              pressed.value = withTiming(1, { duration: 100 });
            }}
            onPressOut={() => {
              pressed.value = withTiming(0, { duration: 200 });
            }}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[
              styles.submitButton,
              { backgroundColor: colors.accent },
              submitAnimatedStyle,
            ]}
          >
            <Text style={[typography.h3, { color: "#FFFFFF" }]}>
              {isSubmitting ? t("report.submitting") : t("report.submit")}
            </Text>
          </AnimatedPressable>
        </View>
      </TrueSheet>
    );
  }
);

ReportBottomSheet.displayName = "ReportBottomSheet";

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  reasonsSection: {
    marginBottom: 20,
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
  descriptionSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ReportBottomSheet;

