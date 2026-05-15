// src/lib/supabase.ts
// Supabase client with platform-aware storage (SecureStore on native, localStorage on web)

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Web storage adapter (uses localStorage) ──────────────
const WebStorageAdapter = {
  getItem: (key: string) => {
    if (typeof localStorage === 'undefined') return Promise.resolve(null);
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// ─── Native storage adapter (uses SecureStore) ────────────
const getNativeStorageAdapter = () => {
  const SecureStore = require('expo-secure-store');
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
};

const ExpoSecureStoreAdapter = Platform.OS === 'web' ? WebStorageAdapter : getNativeStorageAdapter();

// ─── Pull config from app.json extra (never hardcode in source) ──
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Set supabaseUrl and supabaseAnonKey in app.json extra.'
  );
}

// ─── Create client ───────────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,       // Refresh JWT before expiry
    persistSession: true,          // Persist across app restarts
    detectSessionInUrl: false,     // Not needed for native apps
  },
  realtime: {
    params: {
      eventsPerSecond: 10,        // Rate limit real-time events
    },
  },
});

// ─── Helper: get current user's ID ──────────────────────────
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

// ─── Helper: get current session (with auto-refresh) ────────
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
