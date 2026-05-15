// src/lib/notifications.ts
// Expo push notification registration and handling

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Register for push notifications ──────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications don't work on simulators
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('shopping-updates', {
      name: 'Shopping Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
      sound: 'default',
    });
  }

  try {
    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Expo push token:', token);

    // Save token to profile in Supabase
    const { updatePushToken } = useAuthStore.getState();
    await updatePushToken(token);

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

// ─── Handle notification tap (navigate to group) ──────────
export function setupNotificationHandlers(
  router: { push: (path: string) => void }
) {
  // When user taps on a notification
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as {
        groupId?: string;
        itemId?: string;
      };

      if (data.groupId) {
        // Navigate to the relevant group
        router.push(`/group/${data.groupId}`);
      }
    }
  );

  return () => subscription.remove();
}
