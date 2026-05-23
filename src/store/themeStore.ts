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
  darkMode: boolean;
  setTheme: (index: number) => void;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeIndex: typeof window !== 'undefined' ? Number(localStorage.getItem('shoply-theme') ?? 0) : 0,
  darkMode: typeof window !== 'undefined' ? localStorage.getItem('shoply-dark') === 'true' : false,
  setTheme: (index) => {
    if (typeof window !== 'undefined') localStorage.setItem('shoply-theme', String(index));
    set({ themeIndex: index });
  },
  toggleDarkMode: () => {
    const next = !get().darkMode;
    if (typeof window !== 'undefined') localStorage.setItem('shoply-dark', String(next));
    set({ darkMode: next });
  },
}));