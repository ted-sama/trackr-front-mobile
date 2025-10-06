import { useTheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";

export default function MeLayout() {
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
      <Stack.Screen name="edit" options={{
        presentation: "modal",
        gestureEnabled: true,
        headerShown: false,
      }} />
      <Stack.Screen name="reorder" options={{
        presentation: "modal",
        gestureEnabled: true,
        headerShown: false,
      }} />
      <Stack.Screen name="lists" />
    </Stack>
  );
}
