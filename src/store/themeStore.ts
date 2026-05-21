// src/store/themeStore.ts
import { create } from 'zustand';

export const THEMES = [
  { name: 'Indigo', primary: '#6366F1', primaryLight: '#818CF8', primaryDark: '#4F46E5', primarySurface: '#EEF2FF' },
  { name: 'Groen', primary: '#10B981', primaryLight: '#34D399', primaryDark: '#059669', primarySurface: '#ECFDF5' },
  { name: 'Blauw', primary: '#3B82F6', primaryLight: '#60A5FA', primaryDark: '#2563EB', primarySurface: '#EFF6FF' },
  { name: 'Paars', primary: '#8B5CF6', primaryLight: '#A78BFA', primaryDark: '#7C3AED', primarySurface: '#F5F3FF' },
  { name: 'Roze', primary: '#EC4899', primaryLight: '#F472B6', primaryDark: '#DB2777', primarySurface: '#FDF2F8' },
  { name: 'Oranje', primary: '#F97316', primaryLight: '#FB923C', primaryDark: '#EA580C', primarySurface: '#FFF7ED' },
];

interface ThemeState {
  themeIndex: number;
  setTheme: (index: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeIndex: 0,
  setTheme: (index) => set({ themeIndex: index }),
}));