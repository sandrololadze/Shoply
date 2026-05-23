// src/lib/design.ts
import { Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export function useColors() {
  const { themeIndex, darkMode } = useThemeStore();
  const THEMES = [
    { primary: '#6366F1', primaryLight: '#818CF8', primaryDark: '#4F46E5', primarySurface: darkMode ? '#1e1b4b' : '#EEF2FF' },
    { primary: '#10B981', primaryLight: '#34D399', primaryDark: '#059669', primarySurface: darkMode ? '#052e16' : '#ECFDF5' },
    { primary: '#3B82F6', primaryLight: '#60A5FA', primaryDark: '#2563EB', primarySurface: darkMode ? '#1e3a5f' : '#EFF6FF' },
    { primary: '#8B5CF6', primaryLight: '#A78BFA', primaryDark: '#7C3AED', primarySurface: darkMode ? '#2e1065' : '#F5F3FF' },
    { primary: '#EC4899', primaryLight: '#F472B6', primaryDark: '#DB2777', primarySurface: darkMode ? '#4a0025' : '#FDF2F8' },
    { primary: '#F97316', primaryLight: '#FB923C', primaryDark: '#EA580C', primarySurface: darkMode ? '#431407' : '#FFF7ED' },
  ];
  const theme = THEMES[themeIndex] || THEMES[0];

  return {
    ...theme,
    success: '#10B981',
    successLight: darkMode ? '#052e16' : '#D1FAE5',
    warning: '#F59E0B',
    warningLight: darkMode ? '#451a03' : '#FEF3C7',
    danger: '#EF4444',
    dangerLight: darkMode ? '#450a0a' : '#FEE2E2',
    bg: darkMode ? '#0F172A' : '#F8FAFC',
    bgCard: darkMode ? '#1E293B' : '#FFFFFF',
    bgElevated: darkMode ? '#334155' : '#F1F5F9',
    border: darkMode ? '#334155' : '#E2E8F0',
    borderDark: darkMode ? '#475569' : '#CBD5E1',
    text: darkMode ? '#F1F5F9' : '#0F172A',
    textSecondary: darkMode ? '#94A3B8' : '#64748B',
    textTertiary: darkMode ? '#64748B' : '#94A3B8',
    textInverse: darkMode ? '#0F172A' : '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.08)',
    admin: '#7C3AED',
    adminSurface: darkMode ? '#2e1065' : '#EDE9FE',
    member: '#0284C7',
    memberSurface: darkMode ? '#0c2a4a' : '#E0F2FE',
    completed: '#10B981',
    completedSurface: darkMode ? '#052e16' : '#ECFDF5',
    active: theme.primary,
    isDark: darkMode,
  };
}

export const Colors = {
  primary: '#6366F1', primaryLight: '#818CF8', primaryDark: '#4F46E5', primarySurface: '#EEF2FF',
  success: '#10B981', successLight: '#D1FAE5', warning: '#F59E0B', warningLight: '#FEF3C7',
  danger: '#EF4444', dangerLight: '#FEE2E2', bg: '#F8FAFC', bgCard: '#FFFFFF',
  bgElevated: '#F1F5F9', border: '#E2E8F0', borderDark: '#CBD5E1', text: '#0F172A',
  textSecondary: '#64748B', textTertiary: '#94A3B8', textInverse: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.5)', overlayLight: 'rgba(15, 23, 42, 0.08)',
  admin: '#7C3AED', adminSurface: '#EDE9FE', member: '#0284C7', memberSurface: '#E0F2FE',
  completed: '#10B981', completedSurface: '#ECFDF5', active: '#6366F1',
};

export const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 30, '3xl': 36,
  light: '300' as const, regular: '400' as const, medium: '500' as const,
  semibold: '600' as const, bold: '700' as const, extrabold: '800' as const,
  tight: 1.25, normal: 1.5, relaxed: 1.75,
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64,
};

export const Radii = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 9999,
};

export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    android: { elevation: 8 },
  }),
};

const AVATAR_COLORS = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#06B6D4','#3B82F6'];
export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(displayName: string): string {
  return displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}