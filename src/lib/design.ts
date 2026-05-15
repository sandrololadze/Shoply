// src/lib/design.ts
// Design system tokens — single source of truth for all styling

import { Platform } from 'react-native';

export const Colors = {
  // ─── Primary palette ────────────────────────────────────
  primary: '#6366F1',        // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primarySurface: '#EEF2FF',

  // ─── Semantic colors ────────────────────────────────────
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // ─── Neutrals ────────────────────────────────────────────
  bg: '#F8FAFC',
  bgCard: '#FFFFFF',
  bgElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // ─── Text ────────────────────────────────────────────────
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // ─── Overlays ────────────────────────────────────────────
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.08)',

  // ─── Role badges ─────────────────────────────────────────
  admin: '#7C3AED',
  adminSurface: '#EDE9FE',
  member: '#0284C7',
  memberSurface: '#E0F2FE',

  // ─── Item status ─────────────────────────────────────────
  completed: '#10B981',
  completedSurface: '#ECFDF5',
  active: '#6366F1',
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,

  // Font weights (as strings for RN)
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
  }),
};

// ─── Avatar color generation from user ID ─────────────────
const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
];

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
