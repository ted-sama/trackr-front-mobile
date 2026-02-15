import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { api } from '@/services/api';
import { useUserStore } from '@/stores/userStore';
import { useMarkAsRead } from './queries/notifications';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const { currentUser } = useUserStore();
  const markAsRead = useMarkAsRead();

  // Register for push notifications
  async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Skip on simulators/emulators
    if (!Device.isDevice) {
      if (__DEV__) console.log('Push notifications require a physical device');
      return null;
    }

    // Skip in Expo Go - push requires a development build
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      if (__DEV__) console.log('Push notifications are not supported in Expo Go. Use a development build.');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.log('Push notification permission not granted');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        if (__DEV__) console.warn('No EAS project ID found - push notifications may not work in development');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;

      // Android requires channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (err) {
      // Silently fail for known development environment issues
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('aps-environment') || errorMessage.includes('entitlement')) {
        if (__DEV__) console.log('Push notifications require a development build with proper entitlements');
        return null;
      }
      if (__DEV__) console.error('Error registering for push notifications:', err);
      setError(errorMessage);
      return null;
    }
  }

  // Send token to backend
  async function sendTokenToBackend(token: string) {
    try {
      await api.post('/me/push-token', { pushToken: token });
    } catch (err) {
      if (__DEV__) console.error('Failed to register push token with backend:', err);
    }
  }

  // Handle notification tap
  function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    if (!data) return;

    const { type, resourceType, resourceId, notificationId } = data as {
      type?: string;
      resourceType?: string;
      resourceId?: string;
      notificationId?: string;
    };

    // Mark notification as read
    if (notificationId) {
      markAsRead.mutate(notificationId);
    }

    // Navigate based on notification type
    if (type === 'mangacollec-import') {
      router.push('/mangacollec-import');
    } else if (resourceType === 'book_review' && resourceId) {
      // Navigate to notifications screen or book
      router.push('/notifications');
    } else if (resourceType === 'list' && resourceId) {
      router.push(`/list/${resourceId}`);
    } else {
      // Default: go to notifications screen
      router.push('/notifications');
    }
  }

  useEffect(() => {
    // Only register if user is logged in
    if (!currentUser) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToBackend(token);
      }
    }).catch((err) => {
      if (__DEV__) console.error('Error during push notification registration:', err);
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Could invalidate notification queries here if needed
      if (__DEV__) console.log('Notification received:', notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [currentUser?.id]);

  return {
    expoPushToken,
    error,
  };
}
