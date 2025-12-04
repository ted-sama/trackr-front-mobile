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
import { SubscriptionProvider, useSubscription } from "@/contexts/SubscriptionContext";
import { useTrackedBooksStore } from "@/stores/trackedBookStore";
import { useUserStore } from "@/stores/userStore";
import {
  BookActionsBottomSheet,
  StatusEditorBottomSheet,
  RatingEditorBottomSheet,
  ListEditorBottomSheet,
} from "@/components/book-actions";
import CreateListBottomSheet from "@/components/CreateListBottomSheet";
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
          <SubscriptionProvider>
            <ThemeProvider>
              <DropdownProvider>
                <BottomSheetProvider>
                  <BottomSheetModalProvider>
                    <RootLayoutContent />
                  </BottomSheetModalProvider>
                </BottomSheetProvider>
              </DropdownProvider>
            </ThemeProvider>
          </SubscriptionProvider>
        </QueryClientProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Nouveau composant pour accéder au contexte du thème
function RootLayoutContent() {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { loginUser, logoutUser } = useSubscription();
  const fetchMyLibraryBooks = useTrackedBooksStore(
    (state) => state.fetchMyLibraryBooks
  );
  const fetchCurrentUser = useUserStore((state) => state.fetchCurrentUser);
  const currentUser = useUserStore((state) => state.currentUser);
  const isLibraryLoading = useTrackedBooksStore((state) => state.isLoading);
  const libraryError = useTrackedBooksStore((state) => state.error);
  const {
    isBottomSheetVisible,
    selectedBook,
    sheetType,
    closeBottomSheet,
    currentListId,
    isFromListPage,
    openStatusEditor,
    openRatingEditor,
    openListEditor,
    openListCreator,
  } = useBottomSheet();

  // Refs for each bottom sheet
  const actionsSheetRef = useRef<BottomSheetModal>(null);
  const statusEditorSheetRef = useRef<BottomSheetModal>(null);
  const ratingEditorSheetRef = useRef<BottomSheetModal>(null);
  const listEditorSheetRef = useRef<BottomSheetModal>(null);
  const listCreatorSheetRef = useRef<BottomSheetModal>(null);

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

  // Sync RevenueCat user with app authentication
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      // Log in user to RevenueCat when authenticated
      loginUser(currentUser.id);
    } else if (!isAuthenticated) {
      // Log out user from RevenueCat when not authenticated
      logoutUser();
    }
  }, [isAuthenticated, currentUser?.id]);

  // Present or dismiss the appropriate bottom sheet when visibility/type changes
  useEffect(() => {
    if (isBottomSheetVisible && selectedBook) {
      switch (sheetType) {
        case 'actions':
          actionsSheetRef.current?.present();
          break;
        case 'status_editor':
          statusEditorSheetRef.current?.present();
          break;
        case 'rating_editor':
          ratingEditorSheetRef.current?.present();
          break;
        case 'list_editor':
          listEditorSheetRef.current?.present();
          break;
        case 'list_creator':
          listCreatorSheetRef.current?.present();
          break;
      }
    } else {
      // Dismiss all sheets
      actionsSheetRef.current?.dismiss();
      statusEditorSheetRef.current?.dismiss();
      ratingEditorSheetRef.current?.dismiss();
      listEditorSheetRef.current?.dismiss();
      listCreatorSheetRef.current?.dismiss();
    }
  }, [isBottomSheetVisible, sheetType, selectedBook]);

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

      {/* Global Bottom Sheets */}
      {selectedBook && (
        <>
          <BookActionsBottomSheet
            ref={actionsSheetRef}
            book={selectedBook}
            currentListId={currentListId}
            isFromListPage={isFromListPage}
            onDismiss={closeBottomSheet}
            onEditStatusPress={() => openStatusEditor(selectedBook)}
            onRatePress={() => openRatingEditor(selectedBook)}
            onAddToListPress={() => openListEditor(selectedBook)}
          />
          <StatusEditorBottomSheet
            ref={statusEditorSheetRef}
            book={selectedBook}
            onDismiss={closeBottomSheet}
          />
          <RatingEditorBottomSheet
            ref={ratingEditorSheetRef}
            book={selectedBook}
            onDismiss={closeBottomSheet}
          />
          <ListEditorBottomSheet
            ref={listEditorSheetRef}
            book={selectedBook}
            onDismiss={closeBottomSheet}
            onCreateListPress={() => openListCreator(selectedBook)}
          />
          <CreateListBottomSheet
            ref={listCreatorSheetRef}
            onDismiss={closeBottomSheet}
          />
        </>
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
