import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import ThemeProvider, { useTheme } from '../contexts/ThemeContext';
import { BottomSheetProvider } from '../contexts/BottomSheetContext';
import { SearchAnimationProvider } from '../contexts/SearchAnimationContext';
import Toast, { BaseToast, ToastConfig } from 'react-native-toast-message'
import HeaderDiscover from '@/components/discover/HeaderDiscover';


// Config Toast
const toastConfig: ToastConfig = {
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftWidth: 0, width: '90%', height: 50, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 13, fontWeight: '500' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
}


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
      </Tabs>
    </View>
  );
}

// Composant racine qui fournit le contexte de thème
export default function RootLayout() {  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetProvider>
          <SearchAnimationProvider>
            <BottomSheetModalProvider>
                <TabsLayout />
                <Toast autoHide={true} visibilityTime={2000} position='bottom' bottomOffset={100} config={toastConfig} />
            </BottomSheetModalProvider>
          </SearchAnimationProvider>
        </BottomSheetProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}