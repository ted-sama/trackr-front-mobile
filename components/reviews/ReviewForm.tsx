import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react-native";

interface ReviewFormProps {
  initialContent?: string;
  initialIsSpoiler?: boolean;
  isEditing?: boolean;
  isSubmitting?: boolean;
  onSubmit: (content: string, isSpoiler: boolean) => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  initialContent = "",
  initialIsSpoiler = false,
  isEditing = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const [content, setContent] = useState(initialContent);
  const [isSpoiler, setIsSpoiler] = useState(initialIsSpoiler);

  const handleSubmit = () => {
    if (content.trim().length === 0) return;
    onSubmit(content.trim(), isSpoiler);
    if (!isEditing) {
      setContent("");
      setIsSpoiler(false);
    }
  };

  const isValid = content.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          typography.body,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        placeholder={t("reviews.placeholder")}
        placeholderTextColor={colors.secondaryText}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={2000}
        textAlignVertical="top"
        editable={!isSubmitting}
      />
      {/* Spoiler Toggle */}
      <View style={styles.spoilerRow}>
        <View style={styles.spoilerLabel}>
          <AlertTriangle size={16} color={isSpoiler ? "#F59E0B" : colors.secondaryText} />
          <Text style={[typography.caption, { color: isSpoiler ? "#F59E0B" : colors.secondaryText, marginLeft: 6 }]}>
            {t("reviews.containsSpoiler")}
          </Text>
        </View>
        <Switch
          value={isSpoiler}
          onValueChange={setIsSpoiler}
          trackColor={{ false: colors.border, true: "#F59E0B" }}
          thumbColor="#FFFFFF"
          disabled={isSubmitting}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[typography.caption, { color: colors.secondaryText }]}>
          {content.length}/2000
        </Text>
        <View style={styles.buttons}>
          {isEditing && onCancel && (
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: colors.actionButton }]}
              disabled={isSubmitting}
            >
              <Text style={[typography.body, { color: colors.text }]}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleSubmit}
            style={[
              styles.button,
              {
                backgroundColor: isValid ? colors.accent : colors.actionButton,
                opacity: isSubmitting ? 0.6 : 1,
              },
            ]}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  typography.body,
                  { color: isValid ? "#FFFFFF" : colors.secondaryText },
                ]}
              >
                {isEditing ? t("reviews.update") : t("reviews.submit")}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  spoilerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  spoilerLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
});
