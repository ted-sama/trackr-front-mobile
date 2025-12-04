import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react-native";

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
      <Text style={[typography.caption, { color: colors.secondaryText, paddingHorizontal: 16, marginBottom: 8 }]}>{t("chat.predefinedQuestions.title")}</Text>
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
                typography.h3,
                styles.pillText,
                { color: colors.tabBarText },
              ]}
              numberOfLines={2}
            >
              {question.text}
            </Text>
            <ChevronRight size={20} color={colors.tabBarText} />
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
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 220,
    flexDirection: "row",
    gap: 4,
  },
  pillText: {
    textAlign: "left",
    lineHeight: 20,
  },
});
