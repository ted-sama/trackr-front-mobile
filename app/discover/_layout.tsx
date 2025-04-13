import { Stack } from 'expo-router';

export default function DiscoverLayout() {  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        presentation: 'transparentModal',
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}