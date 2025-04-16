import React from 'react';
import { StyleSheet } from 'react-native';
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
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

// Nouveau composant pour accéder au contexte du thème
function RootLayoutContent() {
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
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
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name='book/[id]' />
          </Stack>
          <Toast autoHide={true} visibilityTime={2000} position='bottom' bottomOffset={100} config={toastConfig} />
        </BottomSheetModalProvider>
      </BottomSheetProvider>
    </GestureHandlerRootView>
  );
}