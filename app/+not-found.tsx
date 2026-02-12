import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import * as Linking from 'expo-linking';

/**
 * Catch-all screen for unmatched routes.
 * Handles OAuth callback deep links on Android where the deep link
 * is processed by the router even though openAuthSessionAsync already
 * handled the tokens. This screen simply redirects to the appropriate page.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, processOAuthCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleRedirect = async () => {
      const url = await Linking.getInitialURL();

      // Check if this is an OAuth callback
      if (url && url.includes('auth/callback')) {
        // If already authenticated (openAuthSessionAsync already processed tokens),
        // just navigate to the home screen
        if (isAuthenticated) {
          router.replace('/');
          return;
        }

        // If not yet authenticated, try to extract and process tokens
        const queryStart = url.indexOf('?');
        if (queryStart !== -1) {
          const queryString = url.substring(queryStart + 1);
          const params = new URLSearchParams(queryString);
          const token = params.get('token');
          const refreshToken = params.get('refreshToken');

          if (token) {
            const success = await processOAuthCallback(token, refreshToken ?? undefined);
            if (success) return; // Auth guard will redirect automatically
          }
        }

        router.replace('/auth');
        return;
      }

      // For any other unmatched route, go back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    };

    handleRedirect();
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
