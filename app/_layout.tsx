import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import ThemeProvider, { useTheme } from '../contexts/ThemeContext';

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
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
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
            shadowColor: 'transparent',
            elevation: 2,
            height: 105,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: 'bold',
            fontSize: 16,
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
          <TabsLayout />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}