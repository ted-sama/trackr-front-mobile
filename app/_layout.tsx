import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import ThemeProvider, { useTheme } from '../contexts/ThemeContext';
import { BottomSheetProvider } from '../contexts/BottomSheetContext';
import Toast, { BaseToast, ToastConfig } from 'react-native-toast-message';
import { Stack } from 'expo-router';
import {
  useFonts,
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { DropdownProvider } from '@/contexts/DropdownContext';
// import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Removed
import { useAuthStore } from '@/state/authStore'; // Added
import { useTrackedBooksStore } from '@/state/tracked-books-store'; // Ensure this is active

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

// Composant racine qui fournit les contextes globaux
export default function RootLayout() {
  // AuthProvider removed
  return (
    <ThemeProvider>
      <DropdownProvider>
        <RootLayoutContent />
      </DropdownProvider>
    </ThemeProvider>
  );
}

// Nouveau composant pour accéder au contexte du thème
function RootLayoutContent() {
  const { colors } = useTheme();
  // const { isAuthenticated } = useAuth(); // Removed
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuthStore(); // Added

  const [fontsLoaded] = useFonts({
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    // Call checkAuthStatus on initial load
    useAuthStore.getState().checkAuthStatus();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !authIsLoading) { // Updated condition
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authIsLoading]); // Updated dependencies

  useEffect(() => {
    if (isAuthenticated) {
      useTrackedBooksStore.getState().fetchMyLibrary();
    } else {
      // Ensure library is cleared if user is not authenticated
      // This is also handled in authStore.logout, but good for safety.
      useTrackedBooksStore.getState().clearTrackedBooks();
    }
  }, [isAuthenticated]);

  if (!fontsLoaded || authIsLoading) { // Updated condition to keep splash visible while auth is loading
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <BottomSheetProvider>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
            initialRouteName='(tabs)'
          >
            <Stack.Screen name='auth/login' />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name='book/[id]' />
            <Stack.Screen name='category-full' />
            <Stack.Screen name='list-full' />
            {/* <Stack.Screen name='book/tracking-settings' getId={({ params }) => params?.bookId}  options={{presentation: Platform.OS === 'ios' ? 'formSheet' : 'card'}}/>
            <Stack.Screen name='book/chapter-list' getId={({ params }) => params?.bookId} options={{presentation: Platform.OS === 'ios' ? 'formSheet' : 'card'}} /> */}
          </Stack>
          <Toast autoHide={true} visibilityTime={2000} position='bottom' bottomOffset={100} config={toastConfig} />
        </BottomSheetModalProvider>
      </BottomSheetProvider>
    </GestureHandlerRootView>
  );
}