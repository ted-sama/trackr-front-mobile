import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, TextInput, ScrollView as DefaultScrollView, StyleSheet, Platform, Image, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch"
import { router, useLocalSearchParams } from "expo-router";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence } from "react-native-reanimated";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Sources from "@/components/chat/Sources";
import { useBook } from "@/hooks/queries/books";
import { getPalette } from "@somesoap/react-native-image-palette";
import Animated from "react-native-reanimated";
import Markdown from "@ronradtke/react-native-markdown-display";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Circle } from "lucide-react-native";
import { PredefinedQuestions } from "@/components/chat/PredefinedQuestions";

const AnimatedScrollView = Animated.createAnimatedComponent(DefaultScrollView);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Composant pour les trois points animés
const TypingIndicator = ({ color }: { color?: string }) => {
  const { colors } = useTheme();

  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      false
    );

    setTimeout(() => {
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );
    }, 133);

    setTimeout(() => {
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );
    }, 266);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  const dotColor = color || colors.secondaryText;

  return (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, { backgroundColor: dotColor }, dot1Style]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: dotColor }, dot2Style]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: dotColor }, dot3Style]} />
    </View>
  );
};

export default function ChatScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { bookId } = useLocalSearchParams();
    const { data: book } = useBook(bookId as string);
    const typography = useTypography();
    const [input, setInput] = useState<string>('');
    const [inputHeight, setInputHeight] = useState(48);
    const [dominantColor, setDominantColor] = useState<string | null>(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const keyboardHeight = useSharedValue(30);
    const scrollViewRef = useRef<DefaultScrollView>(null);
    const previousMessagesLength = useRef(0);
    const { token } = useAuth();
    const { messages, error, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            fetch: expoFetch as unknown as typeof globalThis.fetch,
            api: `http://localhost:3333/chat/${bookId}`,
            // api: `https://api.trackrr.app/chat/${bookId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }),
        onError: (error) => {
            console.error(error);
        },
    });

    // Gradient opacity animation
    const gradientOpacity = useSharedValue(0);

    const gradientAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: gradientOpacity.value,
        };
    });

    useEffect(() => {
        if (book?.coverImage) {
            getPalette(book.coverImage).then(palette => setDominantColor(palette.vibrant));
        }
    }, [book?.coverImage]);

    // Animate gradient opacity when gradient color is available
    useEffect(() => {
        if (dominantColor) {
            gradientOpacity.value = withTiming(0.45, { duration: 100 });
        }
    }, [dominantColor]);

    // Auto-scroll seulement quand un nouveau message est ajouté, pas pendant le streaming
    useEffect(() => {
      if (messages.length > previousMessagesLength.current && !isUserScrolling) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
      previousMessagesLength.current = messages.length;
    }, [messages.length, isUserScrolling]);

    useEffect(() => {
      const keyboardWillShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          keyboardHeight.value = withTiming(e.endCoordinates.height, {
            duration: Platform.OS === 'ios' ? 250 : 200,
          });
        }
      );
      const keyboardWillHide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          keyboardHeight.value = withTiming(30, {
            duration: Platform.OS === 'ios' ? 250 : 200,
          });
        }
      );

      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }, []);

    const handleSend = () => {
      if (input.trim()) {
        sendMessage({
          text: input,
        });
        setInput('');
        setIsUserScrolling(false); // Réinitialiser pour auto-scroll après l'envoi
      }
    };

    const handleScroll = () => {
      // Détecter que l'utilisateur est en train de scroller manuellement
      setIsUserScrolling(true);
    };

  const gradientHeight = 10;

  const inputContainerStyle = useAnimatedStyle(() => {
    return {
      bottom: keyboardHeight.value,
    };
  });

  const sendButtonScale = useSharedValue(1);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const handleSendPressIn = () => {
    sendButtonScale.value = withTiming(0.9, { duration: 100 });
  };

  const handleSendPressOut = () => {
    sendButtonScale.value = withTiming(1, { duration: 100 });
  };

  // Créer les styles Markdown en fusionnant typography avec les couleurs
  const markdownStyles = React.useMemo(() => ({
    body: {
      ...typography.body,
      color: colors.text
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
    },
    heading1: {
      ...typography.h2,
      color: colors.text
    },
    heading2: {
      ...typography.h2,
      color: colors.text,
      marginTop: 16,
      marginBottom: 12,
    },
    heading3: {
      ...typography.h3,
      color: colors.text
    },
    heading4: {
      ...typography.bodyBold,
      color: colors.text
    },
    heading5: {
      ...typography.bodyBold,
      color: colors.text
    },
    heading6: {
      ...typography.bodyBold,
      color: colors.text
    },
    strong: {
      ...typography.bodyBold,
      color: colors.text
    },
    em: {
      ...typography.body,
      fontStyle: 'italic' as const,
      color: colors.text
    },
    list_item: {
      color: colors.text,
    },
    text: {
      color: colors.text,
    },
    link: {
      color: colors.primary,
    },
    blockquote: {
      backgroundColor: colors.card,
      paddingLeft: 8,
      paddingVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      marginVertical: 8,
    },
    code_inline: {
      backgroundColor: colors.card,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'SpaceMono-Regular',
      fontSize: 14,
      color: colors.text,
    },
    code_block: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      fontFamily: 'SpaceMono-Regular',
      fontSize: 14,
      color: colors.text,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 8,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 16,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: colors.card,
    },
    tbody: {
      backgroundColor: colors.background,
    },
    th: {
      padding: 8,
      fontWeight: '700' as const,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    td: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  }), [typography, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
        {dominantColor && (
          <Animated.View
            style={[{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              width: "100%",
              height: gradientHeight + 200,
              zIndex: -99,
            }, gradientAnimatedStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[dominantColor, colors.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ width: "100%", height: "100%" }}
            />
          </Animated.View>
        )}

        <AnimatedHeader
          title={"Chat  ·  " + book?.title}
          scrollY={useSharedValue(0)}
          collapseThreshold={0}
          onBack={() => router.back()}
          static={true}
        />

        <AnimatedScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={400}
          >
            {messages.length > 0 && (
              messages.map((m) => {
                const isUser = m.role === 'user';
                const messageText = m.parts.map(p => 'text' in p ? p.text : '').join('');
                const seenUrls = new Set<string>();
                const messageSources = m.parts
                  .map(p =>
                    'url' in p
                      ? { url: p.url, title: 'title' in p ? p.title : '' }
                      : undefined
                  )
                  .filter(
                    (p): p is { url: string; title: string } =>
                      !!p && !seenUrls.has(p.url) && !!seenUrls.add(p.url)
                  );

                return (
                  <View
                    key={m.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.userMessageRow : styles.aiMessageRow
                    ]}
                  >
                    {isUser ? (
                      <View
                        style={[
                          styles.messageBubble,
                          { backgroundColor: colors.card, borderColor: colors.border }
                        ]}
                      >
                        <Text style={[
                          typography.body,
                          styles.messageText,
                          { color: colors.text }
                        ]}>
                          {messageText}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.aiMessageContent}>
                        {dominantColor && (
                          <View style={styles.aiHeader}>
                            <Circle size={22} color={dominantColor} fill={dominantColor} />
                          </View>
                        )}
                        <Markdown style={markdownStyles}>
                          {messageText}
                        </Markdown>
                        {messageSources.length > 0 && (
                          <View style={{ marginTop: 8, marginBottom: 8 }}>
                            <Sources sources={messageSources} />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
            {status === 'submitted' && (
              <View style={[styles.messageRow, styles.aiMessageRow]}>
                <View style={styles.aiMessageContent}>
                  {dominantColor && (
                    <View style={styles.aiHeader}>
                      <Circle size={22} color={dominantColor} fill={dominantColor} />
                    </View>
                  )}
                  <TypingIndicator color={dominantColor || undefined} />
                </View>
              </View>
            )}
          </AnimatedScrollView>

          <Animated.View style={[styles.inputContainer, inputContainerStyle]}>
            <MaskedView
              style={[styles.gradientOverlay, { height: inputHeight + 160 }]}
              maskElement={
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(0,0,0,0.1)',
                    'rgba(0,0,0,0.4)',
                    'rgba(0,0,0,0.7)',
                    'black'
                  ]}
                  locations={[0, 0.3, 0.6, 0.8, 1]}
                  style={StyleSheet.absoluteFill}
                />
              }
              pointerEvents="none"
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            </MaskedView>
            {messages.length === 0 && (
              <PredefinedQuestions
                onQuestionPress={(question) => setInput(question)}
              />
            )}
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[
                  typography.body,
                  styles.input,
                  { color: colors.text }
                ]}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                onContentSizeChange={(e) => {
                  setInputHeight(Math.min(100, Math.max(48, e.nativeEvent.contentSize.height + 16)));
                }}
                placeholder={t("chat.messagePlaceholder")}
                placeholderTextColor={colors.secondaryText}
                autoCorrect={false}
                multiline
                maxLength={1000}
              />

              <AnimatedPressable
                onPress={handleSend}
                onPressIn={handleSendPressIn}
                onPressOut={handleSendPressOut}
                disabled={!input.trim()}
                style={[styles.sendButton, sendButtonAnimatedStyle]}
              >
                <View style={[
                  styles.sendButtonInner,
                  {
                    backgroundColor: colors.secondaryButton,
                    opacity: input.trim() ? 1 : 0.5
                  }
                ]}>
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={colors.secondaryButtonText}
                  />
                </View>
              </AnimatedPressable>
            </View>
          </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingTop: 60,
  },
  messagesContainer: {
    flex: 1,
    paddingTop: 160,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 180,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  bookInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bookImage: {
    width: 100,
    height: 100 * 1.5,
    borderRadius: 6,
  },
  messageRow: {
    marginBottom: 16,
  },
  userMessageRow: {
    alignItems: 'flex-end',
  },
  aiMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    maxWidth: '75%',
    borderBottomRightRadius: 4,
  },
  aiMessageContent: {
    paddingVertical: 4,
    width: '100%',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageText: {
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 40,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    borderWidth: 1,
    zIndex: 1,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 8,
    marginBottom: 1,
  },
  sendButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
