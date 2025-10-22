import React, { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch"
import { router } from "expo-router";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { SharedValue, useSharedValue } from "react-native-reanimated";

export default function ChatScreen() {
    const { colors } = useTheme();
    const [input, setInput] = useState<string>('');
    const { messages, error, sendMessage } = useChat({
        transport: new DefaultChatTransport({
            fetch: expoFetch as unknown as typeof globalThis.fetch,
            api: 'http://localhost:3333/chat',
        }),
        onError: (error) => {
            console.error(error);
        },
    });

  return (
    <SafeAreaView style={{ height: '100%', backgroundColor: colors.background }}>
        <AnimatedHeader
          title="Chat"
          scrollY={useSharedValue(0)}
          collapseThreshold={0}
          onBack={() => router.back()}
          static={true}
        />
        <ScrollView style={{ flex: 1, paddingTop: 60 }}>
        {messages.map((m) => (
          <View key={m.id} style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: 'bold', color: colors.secondaryText }}>{m.role}:</Text>
            <Text style={{ color: colors.text }}>{m.parts.map(p => 'text' in p ? p.text : '').join('')}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, padding: 10, color: colors.text }}
          value={input}
          onChange={e => setInput(e.nativeEvent.text)}
          onSubmitEditing={e => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput('');
          }}
          autoFocus={true}
          autoCorrect={false}
          placeholderTextColor={colors.secondaryText}
          placeholder="Tapez votre message..."
        />
        <Pressable onPress={() => sendMessage({ text: input })} disabled={!input.trim()}>
          <Text style={{ padding: 10 }}>Envoyer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
