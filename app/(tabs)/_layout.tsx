import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext'; // Ajustement du chemin
import { CircleUserRound, Library, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{
        bottom: Platform.OS === "android" ? 10 : insets.bottom
      }}
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: currentTheme === 'dark' ? '#888' : '#999',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 120,
          },
        },
        headerShown: false,
        tabBarBackground: () => (
          <View style={{ backgroundColor: colors.background, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        ),
        lazy: false,
      }}
    >
      <Tabs.Screen
        name="index" // Correspondra à app/(tabs)/index.tsx
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover" // Correspondra au layout app/(tabs)/discover/_layout.tsx
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color, size }) => (
            <Library size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <CircleUserRound size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 