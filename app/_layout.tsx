import React, { useEffect, useState, useRef } from "react";
import '@/i18n'
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import ThemeProvider, { useTheme } from "../contexts/ThemeContext";
import {
  BottomSheetProvider,
  useBottomSheet,
} from "../contexts/BottomSheetContext";
import { Toaster } from "sonner-native"
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
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Composant racine qui fournit les contextes globaux
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <DropdownProvider>
              <BottomSheetProvider>
                <BottomSheetModalProvider>
                  <RootLayoutContent />
                </BottomSheetModalProvider>
              </BottomSheetProvider>
            </DropdownProvider>
          </ThemeProvider>
        </QueryClientProvider>
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
  }, [isAuthenticated]);

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
      >
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="auth" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(zShared)" />
          <Stack.Screen name="category-full" />
        </Stack.Protected>
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
      <Toaster
        visibleToasts={1}
        toastOptions={{
          style: {
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 15,
          },
          titleStyle: {
            color: colors.text,
            fontFamily: "Manrope_500Medium",
            fontSize: 14,
            letterSpacing: -0.3,
          },
          descriptionStyle: {
            color: colors.text,
            fontFamily: "Manrope_500Medium",
            fontSize: 14,
            letterSpacing: -0.3,
          },
        }}
      />
    </>
  );
}
