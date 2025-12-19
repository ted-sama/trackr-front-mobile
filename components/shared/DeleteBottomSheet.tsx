import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
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
import { AlertTriangle, Trash2, Info, AlertCircle, type LucideIcon } from "lucide-react-native";

export type ConfirmationVariant = "destructive" | "warning" | "info";

const VARIANT_CONFIG: Record<ConfirmationVariant, { color: string; Icon: LucideIcon }> = {
  destructive: { color: "#ef4444", Icon: AlertTriangle },
  warning: { color: "#f59e0b", Icon: AlertCircle },
  info: { color: "#3b82f6", Icon: Info },
};

export interface DeleteBottomSheetProps {
  /** Title displayed at the top */
  title: string;
  /** Message/description explaining the action */
  message: string;
  /** Optional item name to display (will be shown in quotes) */
  itemName?: string;
  /** Async function called when user confirms */
  onConfirm: () => Promise<void>;
  /** Loading state for the confirm button */
  isDeleting?: boolean;
  /** Callback when sheet is dismissed */
  onDismiss?: () => void;
  /** Visual variant - changes icon and colors (default: "destructive") */
  variant?: ConfirmationVariant;
  /** Custom icon component (overrides variant icon) */
  icon?: LucideIcon;
  /** Custom accent color (overrides variant color) */
  accentColor?: string;
  /** Custom confirm button text (default: t("common.delete")) */
  confirmText?: string;
  /** Custom confirm button icon (default: Trash2, set to null to hide) */
  confirmIcon?: LucideIcon | null;
  /** Custom cancel button text (default: t("common.cancel")) */
  cancelText?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DeleteBottomSheet = forwardRef<TrueSheet, DeleteBottomSheetProps>(
  (
    {
      title,
      message,
      itemName,
      onConfirm,
      isDeleting = false,
      onDismiss,
      variant = "destructive",
      icon,
      accentColor,
      confirmText,
      confirmIcon,
      cancelText,
    },
    ref
  ) => {
    const { colors, currentTheme } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();

    // Resolve variant config with custom overrides
    const variantConfig = VARIANT_CONFIG[variant];
    const resolvedColor = accentColor ?? variantConfig.color;
    const IconComponent = icon ?? variantConfig.Icon;
    const ConfirmIconComponent = confirmIcon === undefined ? Trash2 : confirmIcon;

    const cancelScale = useSharedValue(1);
    const deleteScale = useSharedValue(1);

    const cancelAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cancelScale.value }],
    }));

    const deleteAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: deleteScale.value }],
    }));

    const handleDismiss = useCallback(() => {
      if (onDismiss) onDismiss();
    }, [onDismiss]);

    const handleCancel = useCallback(() => {
      const sheetRef = typeof ref === "object" ? ref?.current : null;
      sheetRef?.dismiss();
    }, [ref]);

    const handleConfirm = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await onConfirm();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const sheetRef = typeof ref === "object" ? ref?.current : null;
        sheetRef?.dismiss();
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, [onConfirm, ref]);

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        backgroundColor={colors.background}
        grabber={false}
        onDidDismiss={handleDismiss}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: currentTheme === "dark"
                  ? `${resolvedColor}26`
                  : `${resolvedColor}1A`,
              },
            ]}
          >
            <IconComponent size={32} color={resolvedColor} />
          </View>

          {/* Title */}
          <Text style={[typography.h2, styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {/* Item name if provided */}
          {itemName && (
            <Text
              style={[typography.body, styles.itemName, { color: colors.text }]}
              numberOfLines={2}
            >
              "{itemName}"
            </Text>
          )}

          {/* Message */}
          <Text
            style={[typography.body, styles.message, { color: colors.secondaryText }]}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel button */}
            <AnimatedPressable
              onPressIn={() => {
                cancelScale.value = withTiming(0.97, { duration: 100 });
              }}
              onPressOut={() => {
                cancelScale.value = withTiming(1, { duration: 100 });
              }}
              onPress={handleCancel}
              disabled={isDeleting}
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: colors.actionButton,
                  opacity: isDeleting ? 0.5 : 1,
                },
                cancelAnimatedStyle,
              ]}
            >
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {cancelText ?? t("common.cancel")}
              </Text>
            </AnimatedPressable>

            {/* Confirm button */}
            <AnimatedPressable
              onPressIn={() => {
                deleteScale.value = withTiming(0.97, { duration: 100 });
              }}
              onPressOut={() => {
                deleteScale.value = withTiming(1, { duration: 100 });
              }}
              onPress={handleConfirm}
              disabled={isDeleting}
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: resolvedColor, opacity: isDeleting ? 0.6 : 1 },
                deleteAnimatedStyle,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  {ConfirmIconComponent && (
                    <ConfirmIconComponent size={16} color="#fff" />
                  )}
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: "#fff", marginLeft: ConfirmIconComponent ? 6 : 0 },
                    ]}
                  >
                    {confirmText ?? t("common.delete")}
                  </Text>
                </>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </TrueSheet>
    );
  }
);

DeleteBottomSheet.displayName = "DeleteBottomSheet";

// Alias for more generic naming
export const ConfirmationBottomSheet = DeleteBottomSheet;

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginTop: 16,
  },
  itemName: {
    textAlign: "center",
    fontWeight: "600",
    marginTop: 8,
  },
  message: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {},
  confirmButton: {
    flexDirection: "row",
  },
});

export default DeleteBottomSheet;
export type { DeleteBottomSheetProps as ConfirmationBottomSheetProps };
