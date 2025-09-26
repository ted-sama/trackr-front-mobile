import { Stack } from "expo-router";

export default function ListLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
          name="edit"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="reorder"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            headerShown: false,
          }}
        />
    </Stack>
  );
}