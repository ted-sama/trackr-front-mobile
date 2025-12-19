import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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
import { AlertTriangle } from "lucide-react-native";

export interface UnsavedChangesBottomSheetProps {
  /** Callback when user chooses to discard changes */
  onDiscard: () => void;
  /** Callback when sheet is dismissed (user chooses to continue editing) */
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const UnsavedChangesBottomSheet = forwardRef<TrueSheet, UnsavedChangesBottomSheetProps>(
  ({ onDiscard, onDismiss }, ref) => {
    const { colors, currentTheme } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();

    const continueScale = useSharedValue(1);
    const discardScale = useSharedValue(1);

    const continueAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: continueScale.value }],
    }));

    const discardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: discardScale.value }],
    }));

    const handleDismiss = useCallback(() => {
      if (onDismiss) onDismiss();
    }, [onDismiss]);

    const handleContinue = useCallback(() => {
      const sheetRef = typeof ref === "object" ? ref?.current : null;
      sheetRef?.dismiss();
    }, [ref]);

    const handleDiscard = useCallback(() => {
      const sheetRef = typeof ref === "object" ? ref?.current : null;
      sheetRef?.dismiss();
      onDiscard();
    }, [onDiscard, ref]);

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
                  ? `${colors.accent}26`
                  : `${colors.accent}1A`,
              },
            ]}
          >
            <AlertTriangle size={32} color={colors.accent} />
          </View>

          {/* Title */}
          <Text style={[typography.h2, styles.title, { color: colors.text }]}>
            {t("common.unsavedChangesTitle")}
          </Text>

          {/* Message */}
          <Text
            style={[typography.body, styles.message, { color: colors.secondaryText }]}
          >
            {t("common.unsavedChangesMessage")}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Discard button */}
            <AnimatedPressable
              onPressIn={() => {
                discardScale.value = withTiming(0.97, { duration: 100 });
              }}
              onPressOut={() => {
                discardScale.value = withTiming(1, { duration: 100 });
              }}
              onPress={handleDiscard}
              style={[
                styles.button,
                styles.discardButton,
                {
                  backgroundColor: colors.actionButton,
                },
                discardAnimatedStyle,
              ]}
            >
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {t("common.discardChanges")}
              </Text>
            </AnimatedPressable>

            {/* Continue button */}
            <AnimatedPressable
              onPressIn={() => {
                continueScale.value = withTiming(0.97, { duration: 100 });
              }}
              onPressOut={() => {
                continueScale.value = withTiming(1, { duration: 100 });
              }}
              onPress={handleContinue}
              style={[
                styles.button,
                styles.continueButton,
                { backgroundColor: colors.accent },
                continueAnimatedStyle,
              ]}
            >
              <Text style={[typography.bodyBold, { color: "#fff" }]}>
                {t("common.continueEditing")}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </TrueSheet>
    );
  }
);

UnsavedChangesBottomSheet.displayName = "UnsavedChangesBottomSheet";

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
  discardButton: {},
  continueButton: {
    flexDirection: "row",
  },
});

export default UnsavedChangesBottomSheet;
