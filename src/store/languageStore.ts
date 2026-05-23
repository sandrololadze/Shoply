// src/store/languageStore.ts
import { create } from 'zustand';
import { TRANSLATIONS } from './translations';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇧🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('shoply-language') || 'en';
};

interface LanguageState {
  languageCode: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  languageCode: getInitialLanguage(),
  setLanguage: (code) => {
    if (typeof window !== 'undefined') localStorage.setItem('shoply-language', code);
    set({ languageCode: code });
  },
  t: (key) => {
    const lang = get().languageCode;
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
  },
}));