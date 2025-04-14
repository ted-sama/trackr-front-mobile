import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import ThemeProvider from '../contexts/ThemeContext';
import { BottomSheetProvider } from '../contexts/BottomSheetContext';
import Toast, { BaseToast, ToastConfig } from 'react-native-toast-message';
import { Slot } from 'expo-router';


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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetProvider>
          <BottomSheetModalProvider>
            <Slot />
            <Toast autoHide={true} visibilityTime={2000} position='bottom' bottomOffset={100} config={toastConfig} />
          </BottomSheetModalProvider>
        </BottomSheetProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}