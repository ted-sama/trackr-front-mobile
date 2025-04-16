import { useTheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";

export default function DiscoverLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
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
