import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade', animationDuration: 120 }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="email-flow" options={{ gestureEnabled: true, animation: 'slide_from_right' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}