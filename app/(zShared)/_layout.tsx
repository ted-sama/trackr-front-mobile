import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function SharedLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="book/[id]" />
      <Stack.Screen name="book/[id]/reviews" />
      <Stack.Screen name="chat/[bookId]" />
      <Stack.Screen name="list/[listId]" />
      <Stack.Screen name="profile/[userId]" />
      <Stack.Screen name="activity/[username]" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="subscription" />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}