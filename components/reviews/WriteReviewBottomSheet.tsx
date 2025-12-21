import React, { forwardRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
  Keyboard,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Check, AlertTriangle, Star } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useCreateReview, useUpdateReview } from "@/hooks/queries/reviews";
import { BookReview } from "@/types/review";
import { toast } from "sonner-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface WriteReviewBottomSheetProps {
  bookId: string;
  bookTitle: string;
  userRating?: number | null;
  existingReview?: BookReview | null;
  onSuccess?: () => void;
}

const WriteReviewBottomSheet = forwardRef<TrueSheet, WriteReviewBottomSheetProps>(
  ({ bookId, bookTitle, userRating, existingReview, onSuccess }, ref) => {
    const { colors } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();

    const [content, setContent] = useState(existingReview?.content ?? "");
    const [isSpoiler, setIsSpoiler] = useState(existingReview?.isSpoiler ?? false);
    const isEditing = Boolean(existingReview);

    const { mutate: createReview, isPending: isCreating } = useCreateReview(bookId);
    const { mutate: updateReview, isPending: isUpdating } = useUpdateReview(bookId);

    const isPending = isCreating || isUpdating;
    const canSubmit = content.trim().length >= 10 && userRating !== null && userRating !== undefined;

    // Animation scales
    const spoilerScale = useSharedValue(1);
    const submitScale = useSharedValue(1);

    const spoilerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: spoilerScale.value }],
    }));

    const submitAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: submitScale.value }],
    }));

    useEffect(() => {
      setContent(existingReview?.content ?? "");
      setIsSpoiler(existingReview?.isSpoiler ?? false);
    }, [existingReview]);

    const handleSpoilerToggle = useCallback(() => {
      if (isPending) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsSpoiler(!isSpoiler);
    }, [isPending, isSpoiler]);

    const handleSubmit = useCallback(() => {
      if (!canSubmit || isPending) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (isEditing && existingReview) {
        updateReview(
          { reviewId: existingReview.id, dto: { content: content.trim(), isSpoiler } },
          {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.success(t("reviews.updateSuccess"));
              (ref as React.RefObject<TrueSheet>)?.current?.dismiss();
              onSuccess?.();
            },
            onError: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              toast.error(t("reviews.updateError"));
            },
          }
        );
      } else {
        createReview(
          { content: content.trim(), isSpoiler },
          {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.success(t("reviews.createSuccess"));
              setContent("");
              setIsSpoiler(false);
              (ref as React.RefObject<TrueSheet>)?.current?.dismiss();
              onSuccess?.();
            },
            onError: (error) => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              console.error("Create review error:", error);
              toast.error(t("reviews.createError"));
            },
          }
        );
      }
    }, [canSubmit, isPending, isEditing, existingReview, content, isSpoiler, createReview, updateReview, ref, onSuccess, t]);

    const handleDismiss = useCallback(() => {
      Keyboard.dismiss();
      (ref as React.RefObject<TrueSheet>)?.current?.dismiss();
    }, [ref]);

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        backgroundColor={colors.background}
        grabber={false}
      >
        <View style={styles.container}>
          {/* Header Toolbar */}
          <View style={styles.header}>
            <Pressable
              style={styles.headerButton}
              onPress={handleDismiss}
              hitSlop={8}
            >
              <Text style={[typography.bodyBold, { color: colors.secondaryText }]}>
                {t("common.cancel")}
              </Text>
            </Pressable>

            <Text style={[typography.categoryTitle, { color: colors.text }]} numberOfLines={1}>
              {isEditing ? t("reviews.editReview") : t("reviews.newReview")}
            </Text>

            <View style={styles.headerActions}>
              {/* Spoiler Toggle */}
              <AnimatedPressable
                style={[
                  styles.iconButton,
                  spoilerAnimatedStyle,
                  {
                    backgroundColor: isSpoiler ? "rgba(245, 158, 11, 0.15)" : colors.backButtonBackground,
                    borderWidth: 1,
                    borderColor: isSpoiler ? "#F59E0B" : colors.border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                ]}
                onPressIn={() => {
                  spoilerScale.value = withTiming(0.9, { duration: 100 });
                }}
                onPressOut={() => {
                  spoilerScale.value = withTiming(1, { duration: 100 });
                }}
                onPress={handleSpoilerToggle}
                hitSlop={4}
              >
                <AlertTriangle
                  size={24}
                  color={isSpoiler ? "#F59E0B" : colors.icon}
                  fill={isSpoiler ? "#F59E0B" : "transparent"}
                />
              </AnimatedPressable>

              {/* Submit Button */}
              <AnimatedPressable
                style={[
                  styles.iconButton,
                  submitAnimatedStyle,
                  {
                    backgroundColor: canSubmit ? colors.accent : colors.backButtonBackground,
                    borderWidth: 1,
                    borderColor: canSubmit ? colors.accent : colors.border,
                    opacity: !canSubmit && !isPending ? 0.5 : 1,
                    marginLeft: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                ]}
                onPressIn={() => {
                  if (canSubmit && !isPending) {
                    submitScale.value = withTiming(0.9, { duration: 100 });
                  }
                }}
                onPressOut={() => {
                  submitScale.value = withTiming(1, { duration: 100 });
                }}
                onPress={handleSubmit}
                disabled={!canSubmit || isPending}
                hitSlop={4}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={colors.buttonText} />
                ) : (
                  <Check
                    size={24}
                    color={canSubmit ? colors.buttonText : colors.icon}
                    strokeWidth={2.5}
                  />
                )}
              </AnimatedPressable>
            </View>
          </View>

          {/* Book Title & Rating */}
          <View style={styles.metaInfo}>
            <Text
              style={[
                styles.bookTitle,
                typography.body,
                { color: colors.secondaryText },
              ]}
              numberOfLines={1}
            >
              {bookTitle}
            </Text>

            {userRating !== null && userRating !== undefined ? (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={star <= userRating ? colors.accent : colors.border}
                    fill={star <= userRating ? colors.accent : "transparent"}
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
            ) : (
              <Text style={[typography.bodyCaption, { color: colors.error }]}>
                {t("reviews.ratingRequired")}
              </Text>
            )}
          </View>

          {/* Writing Area with fades */}
          <View style={styles.textAreaContainer}>
            {/* Top fade */}
            <LinearGradient
              colors={[colors.background, `${colors.background}00`]}
              style={styles.fadeTop}
              pointerEvents="none"
            />

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder={t("reviews.startWriting")}
                placeholderTextColor={colors.secondaryText}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={2000}
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
                editable={!isPending}
                scrollEnabled={false}
              />
            </ScrollView>

            {/* Bottom fade */}
            <LinearGradient
              colors={[`${colors.background}00`, colors.background]}
              style={styles.fadeBottom}
              pointerEvents="none"
            />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[typography.bodyCaption, { color: colors.secondaryText }]}>
              {content.length}/2000
            </Text>
            {isSpoiler && (
              <View style={styles.spoilerBadge}>
                <AlertTriangle size={12} color="#F59E0B" />
                <Text style={[typography.bodyCaption, { color: "#F59E0B", marginLeft: 4 }]}>
                  {t("reviews.markedAsSpoiler")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TrueSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerButton: {
    minWidth: 60,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 60,
    justifyContent: "flex-end",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  metaInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bookTitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textAreaContainer: {
    height: 280,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  textInput: {
    fontSize: 17,
    lineHeight: 26,
    minHeight: 250,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    zIndex: 1,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    zIndex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  spoilerBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default WriteReviewBottomSheet;

