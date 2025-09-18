import React, { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import ThemeProvider, { useTheme } from "../contexts/ThemeContext";
import {
  BottomSheetProvider,
  useBottomSheet,
} from "../contexts/BottomSheetContext";
import Toast, { BaseToast, ToastConfig } from "react-native-toast-message";
import { Stack } from "expo-router";
import {
  useFonts,
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";
import { DropdownProvider } from "@/contexts/DropdownContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useUserStore } from "@/stores/userStore";
import BookActionsBottomSheet from "@/components/BookActionsBottomSheet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Config Toast
const toastConfig: ToastConfig = {
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftWidth: 0,
        width: "90%",
        height: 50,
        backgroundColor: "#fff",
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontFamily: "Manrope_500Medium",
        fontSize: 14,
        lineHeight: 21,
        letterSpacing: -0.3,
      }}
      text2Style={{
        fontFamily: "Manrope_500Medium",
        fontSize: 14,
        lineHeight: 21,
        letterSpacing: -0.3,
      }}
    />
  ),
};

// Composant racine qui fournit les contextes globaux
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <DropdownProvider>
            <BottomSheetProvider>
              <BottomSheetModalProvider>
                <RootLayoutContent />
              </BottomSheetModalProvider>
            </BottomSheetProvider>
          </DropdownProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Nouveau composant pour accéder au contexte du thème
function RootLayoutContent() {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const fetchMyLibraryBooks = useTrackedBooksStore(
    (state) => state.fetchMyLibraryBooks
  );
  const fetchCurrentUser = useUserStore((state) => state.fetchCurrentUser);
  const isLibraryLoading = useTrackedBooksStore((state) => state.isLoading);
  const libraryError = useTrackedBooksStore((state) => state.error);
  const {
    isBottomSheetVisible,
    selectedBook,
    view,
    closeBookActions,
    currentListId,
    isFromListPage,
  } = useBottomSheet();
  const globalBottomSheetRef = useRef<BottomSheetModal>(null);

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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyLibraryBooks();
      fetchCurrentUser();
    }
  }, [isAuthenticated, fetchMyLibraryBooks, fetchCurrentUser]);

  // Present or dismiss global bottom sheet when visibility changes
  useEffect(() => {
    if (isBottomSheetVisible) {
      globalBottomSheetRef.current?.present();
    } else {
      globalBottomSheetRef.current?.dismiss();
    }
  }, [isBottomSheetVisible]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="(tabs)"
      >
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen
          name="book/summary"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="book/recap"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            headerShown: false,
          }}
        />
        <Stack.Screen name="book/chat" />
        <Stack.Screen name="category-full" />
        <Stack.Screen name="list-full" />
        <Stack.Screen
          name="list-edit"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="list-order"
          options={{
            presentation: "modal",
            gestureEnabled: true,
            headerShown: false,
          }}
        />
      </Stack>
      {/* Global Book Actions BottomSheet */}
      {selectedBook && (
        <BookActionsBottomSheet
          ref={globalBottomSheetRef}
          book={selectedBook}
          view={view}
          currentListId={currentListId}
          isFromListPage={isFromListPage}
          onDismiss={closeBookActions}
          backdropDismiss
        />
      )}
      <Toast
        autoHide={true}
        visibilityTime={2000}
        position="bottom"
        bottomOffset={100}
        config={toastConfig}
      />
    </>
  );
}
