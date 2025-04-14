import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext'; // Ajustement du chemin

export default function TabLayout() {
  const { colors, currentTheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: currentTheme === 'dark' ? '#888' : '#999',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
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
    </Tabs>
  );
} 