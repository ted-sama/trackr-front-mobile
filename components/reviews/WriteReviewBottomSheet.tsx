import React, { forwardRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Star, Send } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useCreateReview, useUpdateReview } from "@/hooks/queries/reviews";
import { BookReview } from "@/types/review";
import { BookTracking } from "@/types/reading-status";
import { toast } from "sonner-native";
import Button from "@/components/ui/Button";

interface WriteReviewBottomSheetProps {
  bookId: string;
  bookTitle: string;
  userRating?: number | null;
  existingReview?: BookReview | null;
  onSuccess?: () => void;
}

const WriteReviewBottomSheet = forwardRef<TrueSheet, WriteReviewBottomSheetProps>(
  ({ bookId, bookTitle, userRating, existingReview, onSuccess }, ref) => {
    const { colors, currentTheme } = useTheme();
    const typography = useTypography();
    const { t } = useTranslation();
    
    const [content, setContent] = useState(existingReview?.content ?? "");
    const isEditing = Boolean(existingReview);
    
    const { mutate: createReview, isPending: isCreating } = useCreateReview(bookId);
    const { mutate: updateReview, isPending: isUpdating } = useUpdateReview(bookId);
    
    const isPending = isCreating || isUpdating;
    const canSubmit = content.trim().length >= 10 && userRating !== null && userRating !== undefined;

    useEffect(() => {
      setContent(existingReview?.content ?? "");
    }, [existingReview]);

    const handleSubmit = useCallback(() => {
      if (!canSubmit || isPending) return;
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (isEditing && existingReview) {
        updateReview(
          { reviewId: existingReview.id, dto: { content: content.trim() } },
          {
            onSuccess: () => {
              toast.success(t("reviews.updateSuccess"));
              (ref as React.RefObject<TrueSheet>)?.current?.dismiss();
              onSuccess?.();
            },
            onError: () => {
              toast.error(t("reviews.updateError"));
            },
          }
        );
      } else {
        createReview(
          { content: content.trim() },
          {
            onSuccess: () => {
              toast.success(t("reviews.createSuccess"));
              setContent("");
              (ref as React.RefObject<TrueSheet>)?.current?.dismiss();
              onSuccess?.();
            },
            onError: (error) => {
              console.error("Create review error:", error);
              toast.error(t("reviews.createError"));
            },
          }
        );
      }
    }, [canSubmit, isPending, isEditing, existingReview, content, createReview, updateReview, ref, onSuccess, t]);

    return (
      <TrueSheet
        ref={ref}
        detents={["auto"]}
        cornerRadius={24}
        backgroundColor={colors.background}
        grabber={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[typography.categoryTitle, { color: colors.text }]}>
                {isEditing ? t("reviews.editReview") : t("reviews.writeReview")}
              </Text>
              <Text 
                style={[typography.bodyCaption, { color: colors.secondaryText, marginTop: 4 }]}
                numberOfLines={1}
              >
                {bookTitle}
              </Text>
            </View>

            {/* Rating Info */}
            {userRating !== null && userRating !== undefined ? (
              <View style={[styles.ratingInfo, { backgroundColor: colors.card }]}>
                <Star size={16} fill={colors.primary} color={colors.primary} />
                <Text style={[typography.bodyBold, { color: colors.text, marginLeft: 6 }]}>
                  {t("reviews.yourRating")}: {userRating}/5
                </Text>
              </View>
            ) : (
              <View style={[styles.ratingWarning, { backgroundColor: colors.card, borderColor: colors.error }]}>
                <Text style={[typography.bodyCaption, { color: colors.error }]}>
                  {t("reviews.ratingRequired")}
                </Text>
              </View>
            )}

            {/* Text Input */}
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
              placeholder={t("reviews.placeholder")}
              placeholderTextColor={colors.secondaryText}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="sentences"
              editable={!isPending}
            />

            {/* Character count */}
            <Text style={[typography.bodyCaption, styles.charCount, { color: colors.secondaryText }]}>
              {content.length}/2000
            </Text>

            {/* Submit Button */}
            {isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <Button
                title={isEditing ? t("reviews.update") : t("reviews.publish")}
                onPress={handleSubmit}
                disabled={!canSubmit}
                icon={<Send size={18} color="#fff" />}
                iconPosition="left"
                style={styles.submitButton}
              />
            )}

            {/* Help text */}
            <Text style={[typography.bodyCaption, styles.helpText, { color: colors.secondaryText }]}>
              {t("reviews.helpText")}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </TrueSheet>
    );
  }
);

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
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  ratingWarning: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  textInput: {
    minHeight: 150,
    maxHeight: 250,
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
  helpText: {
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});

export default WriteReviewBottomSheet;

