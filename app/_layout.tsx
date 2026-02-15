import React, { useEffect, useState, useRef } from "react";
import '@/i18n'
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PostHogProvider } from 'posthog-react-native';
import * as SystemUI from 'expo-system-ui';
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
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useMangacollecImportWatcher } from '@/hooks/useMangacollecImportWatcher';
import { prefetchGenreTranslations } from '@/hooks/queries/genres';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

// Root component providing global contexts
export default function RootLayout() {
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
      options={{
        host: "https://eu.i.posthog.com",
        enableSessionReplay: true,
        sessionReplayConfig: {
          maskAllTextInputs: true,
          maskAllImages: false,
          maskAllSandboxedViews: true,
          captureLog: true,
          captureNetworkTelemetry: true,
          throttleDelayMs: 1000,
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <SubscriptionProvider>
              <ThemeProvider>
                <DropdownProvider>
                  <BottomSheetProvider>
                    <RootLayoutContent />
                  </BottomSheetProvider>
                </DropdownProvider>
              </ThemeProvider>
            </SubscriptionProvider>
          </QueryClientProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
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
  const actionsSheetRef = useRef<TrueSheet>(null);
  const statusEditorSheetRef = useRef<TrueSheet>(null);
  const ratingEditorSheetRef = useRef<TrueSheet>(null);
  const listEditorSheetRef = useRef<TrueSheet>(null);
  const listCreatorSheetRef = useRef<TrueSheet>(null);

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

  // Sync native background color with theme (fixes white flash on Android transitions)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  // Prefetch static data on app start
  useEffect(() => {
    prefetchGenreTranslations();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Only fetch library books here - fetchCurrentUser is already called
      // during token validation in AuthContext
      fetchMyLibraryBooks();
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

  // Register for push notifications
  usePushNotifications();

  // Background polling for Mangacollec import jobs
  useMangacollecImportWatcher();

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
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
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
