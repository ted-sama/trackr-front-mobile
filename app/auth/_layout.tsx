import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade', animationDuration: 120 }} initialRouteName="login">
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}