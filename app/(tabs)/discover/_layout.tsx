import { Stack } from "expo-router";

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="search"
        options={{ animation: "fade", animationDuration: 200, gestureEnabled: false }}
      />
    </Stack>
  );
}
