import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { BookOpen, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";

interface RecapBottomSheetProps {
  bookTitle: string;
  chapter: number;
  recap: string;
  isComic?: boolean;
  onClose: () => void;
  onContinueReading: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RecapBottomSheet = forwardRef<TrueSheet, RecapBottomSheetProps>(
  ({ bookTitle, chapter, recap, isComic = false, onClose, onContinueReading }, ref) => {
    const { t } = useTranslation();
    const { colors, currentTheme } = useTheme();
    const typography = useTypography();

    const buttonScale = useSharedValue(1);
    const buttonAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: buttonScale.value }],
    }));

    const handlePressIn = () => {
      buttonScale.value = withTiming(0.98, { duration: 220 });
    };

    const handlePressOut = () => {
      buttonScale.value = withTiming(1, { duration: 220 });
    };

    const handleSheetDismiss = useCallback(() => {
      onClose();
    }, [onClose]);

    const chapterLabel = isComic ? t("book.issue") : t("book.chapter");

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        backgroundColor={colors.background}
        grabber={false}
        onDidDismiss={handleSheetDismiss}
      >
        <View style={styles.content}>
          {/* Icon - centered in colored circle */}
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
            <BookOpen size={32} color={colors.accent} />
          </View>

          {/* Title - centered */}
          <Text style={[typography.h2, styles.title, { color: colors.text }]}>
            {t("home.chapterSummary", { chapter })}
          </Text>

          {/* Subtitle - book title */}
          <Text
            style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}
            numberOfLines={2}
          >
            {bookTitle}
          </Text>

          {/* Recap Content */}
          <ScrollView
            style={styles.recapContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recapContentContainer}
          >
            {recap ? (
              <Text style={[typography.body, { color: colors.text, lineHeight: 22 }]}>
                {recap}
              </Text>
            ) : (
              <Text style={[typography.body, { color: colors.secondaryText }]}>
                {t("home.noRecapAvailable")}
              </Text>
            )}
          </ScrollView>

          {/* Continue Reading Button */}
          <AnimatedPressable
            onPress={onContinueReading}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.continueButton,
              buttonAnimatedStyle,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={[typography.bodyBold, { color: "#FFFFFF" }]}>
              {t("home.continueReading")}
            </Text>
            <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </AnimatedPressable>
        </View>
      </TrueSheet>
    );
  }
);

RecapBottomSheet.displayName = "RecapBottomSheet";

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
  subtitle: {
    textAlign: "center",
    marginTop: 8,
  },
  recapContent: {
    maxHeight: 300,
    marginTop: 16,
    width: "100%",
  },
  recapContentContainer: {
    paddingHorizontal: 8,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    width: "100%",
  },
});

export default RecapBottomSheet;
