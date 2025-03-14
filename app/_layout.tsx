import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import ThemeProvider, { useTheme } from '../contexts/ThemeContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// Composant de layout avec le thème appliqué
function TabsLayout() {
  const { colors, currentTheme } = useTheme();
  
  // Style de base pour tous les écrans
  const screenStyle = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    }
  });
  
  return (
    <View style={screenStyle.container}>
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
          headerStyle: {
            backgroundColor: colors.background,
            shadowRadius: 2,
            shadowOffset: { height: 2, width: 2 },
            shadowColor: colors.border,
            elevation: 2,
          },
          headerTintColor: colors.text,
          animation: 'fade',
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 120,
            },
          },
          headerShown: true,
          tabBarBackground: () => (
            <View style={{ backgroundColor: colors.background, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          ),
          lazy: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Découvrir',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="track"
          options={{
            title: 'Track',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

// Composant racine qui fournit le contexte de thème
export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <TabsLayout />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
