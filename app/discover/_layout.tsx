import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // On gère les headers manuellement
        animation: 'none', // Reanimated prendra le contrôle
      }}
    >
      <Stack.Screen name="index" /> {/* Correspond à discover.tsx */}
      <Stack.Screen name="search" /> {/* Correspond à search.tsx */}
    </Stack>
  );
}