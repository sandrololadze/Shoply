// app/_layout.tsx
// Root layout — sets up all providers and handles initialization

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useNetworkStore } from '../src/store/networkStore';
import { registerForPushNotifications } from '../src/lib/notifications';
import { Colors } from '../src/lib/design';
import { StyleSheet } from 'react-native';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();

// ─── React Query client with offline persistence config ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 30 seconds, stale for 5 minutes
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Retry failed queries with exponential backoff
      retry: (failureCount, error: unknown) => {
        const err = error as { message?: string };
        // Don't retry auth errors
        if (err?.message?.includes('JWT') || err?.message?.includes('unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      // Retry mutations once on network errors
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const { initialize, isInitialized, user } = useAuthStore();
  const { initialize: initNetwork } = useNetworkStore();

  useEffect(() => {
    // Initialize auth state from persisted session
    initialize();

    // Start network monitoring
    const unsubscribe = initNetwork();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Hide splash screen once we know auth state
    SplashScreen.hideAsync();

    // Register for push notifications if logged in
    if (user) {
      registerForPushNotifications().catch(console.error);
    }
  }, [isInitialized, user]);

  // Don't render until auth is resolved
  if (!isInitialized) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.bgCard },
              headerShadowVisible: false,
              headerTintColor: Colors.text,
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 17,
                color: Colors.text,
              },
              contentStyle: { backgroundColor: Colors.bg },
              animation: 'slide_from_right',
            }}
          >
            {/* Auth screens — no header */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            {/* Authenticated screens */}
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
