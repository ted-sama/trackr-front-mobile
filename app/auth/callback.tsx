import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Handles the Google OAuth callback deep link on Android.
 * On Android, the deep link trackr://auth/callback goes through
 * Expo Router instead of being caught by WebBrowser.openAuthSessionAsync.
 * This screen processes the tokens and completes authentication.
 */
export default function AuthCallbackScreen() {
  const { token, refreshToken } = useLocalSearchParams<{ token?: string; refreshToken?: string }>();
  const { processOAuthCallback } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      if (!token) {
        console.error('[Auth Callback] No token found in URL params');
        router.replace('/auth');
        return;
      }

      const success = await processOAuthCallback(token, refreshToken ?? undefined);

      if (!success) {
        console.error('[Auth Callback] Failed to process OAuth tokens');
        router.replace('/auth');
      }
      // On success, AuthContext sets isAuthenticated=true which triggers
      // the routing guard to show authenticated screens automatically
    };

    processCallback();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
