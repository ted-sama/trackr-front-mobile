import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext'; // Ajustement du chemin
import { CircleUserRound, Library } from 'lucide-react-native';

export default function TabLayout() {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
    const supportsLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

  // if (supportsLiquidGlass) {
  //   return (
  //     <NativeTabs tintColor={colors.accent}>
  //       <NativeTabs.Trigger name="index">
  //         <Icon sf="house.fill" />
  //         <Label>{t('home.title')}</Label>
  //       </NativeTabs.Trigger>
  //       <NativeTabs.Trigger name="discover">
  //         <Icon sf="safari" />
  //         <Label>{t('discover.title')}</Label>
  //       </NativeTabs.Trigger>
  //       <NativeTabs.Trigger name="collection">
  //         <Icon sf="books.vertical.fill" />
  //         <Label>{t('collection.title')}</Label>
  //       </NativeTabs.Trigger>
  //       <NativeTabs.Trigger name="me">
  //         <Icon sf="person.crop.circle" />
  //         <Label>{t('profile.title')}</Label>
  //       </NativeTabs.Trigger>
  //     </NativeTabs>
  //   );
  // }

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: currentTheme === 'dark' ? '#888' : '#999',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 10,
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
        sceneStyle: {
          backgroundColor: colors.background,
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
          title: t('home.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover" // Correspondra au layout app/(tabs)/discover/_layout.tsx
        options={{
          title: t('discover.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t('collection.title'),
          tabBarIcon: ({ color, size }) => (
            <Library size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color, size }) => (
            <CircleUserRound size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 