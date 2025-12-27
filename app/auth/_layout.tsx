import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade', animationDuration: 120, contentStyle: { backgroundColor: colors.background } }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="email-flow" options={{ gestureEnabled: true, animation: 'slide_from_right' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}