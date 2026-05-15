// src/store/networkStore.ts
// Track online/offline status and queue mutations when offline

import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isOnline: boolean;
  initialize: () => () => void; // Returns cleanup function
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true, // Assume online initially

  initialize: () => {
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      set({ isOnline: online });
    });

    return unsubscribe; // Call this to cleanup
  },
}));

// ─────────────────────────────────────────────────────────────
// src/lib/notifications.ts
// Push notification setup with Expo
