import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Keyboard,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import Avatar from "@/components/ui/Avatar";
import { Send, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useUserSearch } from "@/hooks/queries/comments";
import { User } from "@/types/user";
import { useUserStore } from "@/stores/userStore";

import { MentionAutocomplete } from "./MentionAutocomplete";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  isReply?: boolean;
  onCancelReply?: () => void;
  autoFocus?: boolean;
}

export function CommentInput({
  onSubmit,
  placeholder,
  isReply,
  onCancelReply,
  autoFocus,
}: CommentInputProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [inputLayout, setInputLayout] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleTextChange = (text: string) => {
    setContent(text);

    // Check for mention trigger
    const lastWord = text.split(" ").pop();
    if (lastWord && lastWord.startsWith("@") && lastWord.length > 1) {
      setMentionQuery(lastWord.substring(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const words = content.split(" ");
    words.pop(); // Remove the partial mention
    const newContent = [...words, `@${user.username} `].join(" ");
    setContent(newContent);
    setShowMentions(false);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content);
    setContent("");
  };

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      {isReply && (
        <View style={[styles.replyIndicator, { backgroundColor: colors.card }]}>
          <Text
            style={[typography.bodyCaption, { color: colors.secondaryText }]}
          >
            {t("reviews.replyingToComment")}
          </Text>
          <Pressable onPress={onCancelReply}>
            <X size={14} color={colors.secondaryText} />
          </Pressable>
        </View>
      )}

      <MentionAutocomplete
        visible={showMentions}
        query={mentionQuery}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentions(false)}
        targetLayout={inputLayout}
      />

      <View style={styles.inputRow}>
        <Avatar image={currentUser?.avatar || undefined} size={32} />
        <View
          style={[styles.inputWrapper, { backgroundColor: colors.card }]}
          onLayout={(e) => setInputLayout(e.nativeEvent.layout)}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text, ...typography.body }]}
            placeholder={placeholder || t("reviews.addComment")}
            placeholderTextColor={colors.secondaryText}
            value={content}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
          />
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={!content.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            { opacity: !content.trim() ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          <Send size={20} color={colors.accent} />
        </Pressable>
      </View>
      <Text
        style={[
          styles.charCount,
          { color: colors.secondaryText, ...typography.caption },
        ]}
      >
        {content.length}/1000
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderTopWidth: 1,
  },
  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    padding: 8,
    marginBottom: 2,
  },
  autocompleteContainer: {
    position: "absolute",
    left: 56, // Align with input
    right: 12,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  charCount: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 48, // Align with input end
  },
});
