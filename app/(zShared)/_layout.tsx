import { Stack } from "expo-router";

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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