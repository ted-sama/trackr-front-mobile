import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";

interface PredefinedQuestionsProps {
  onQuestionPress: (question: string) => void;
  disabled?: boolean;
}

export function PredefinedQuestions({ onQuestionPress, disabled = false }: PredefinedQuestionsProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  const questions = [
    { key: "summarizeLastChapter", text: t("chat.predefinedQuestions.summarizeLastChapter") },
    { key: "presentWork", text: t("chat.predefinedQuestions.presentWork") },
    { key: "analyzeCurrentArc", text: t("chat.predefinedQuestions.analyzeCurrentArc") },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {questions.map((question) => (
          <Pressable
            key={question.key}
            onPress={() => onQuestionPress(question.text)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.pillButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                typography.body,
                styles.pillText,
                { color: colors.text },
              ]}
              numberOfLines={2}
            >
              {question.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -16,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pillButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 220,
  },
  pillText: {
    textAlign: "center",
    lineHeight: 20,
  },
});
