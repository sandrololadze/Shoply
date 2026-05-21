// src/store/languageStore.ts
import { create } from 'zustand';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇧🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    newList: 'New List',
    joinList: 'Join List',
    noLists: 'No lists yet',
    noListsSubtitle: 'Create a new shopping list or join one with an invite code.',
    createFirstList: 'Create Your First List',
    appearance: 'Appearance',
    notifications: 'Notifications',
    pushNotifications: 'Push Notifications',
    pushNotificationsHint: 'Get notified when items are added',
    editName: 'Edit Name',
    save: 'Save',
    cancel: 'Cancel',
    signOut: 'Sign Out',
    language: 'Language',
    profile: 'Profile',
    lists: 'Lists',
  },
  nl: {
    newList: 'Nieuwe Lijst',
    joinList: 'Lijst Joinen',
    noLists: 'Nog geen lijsten',
    noListsSubtitle: 'Maak een nieuwe boodschappenlijst of join er één met een uitnodigingscode.',
    createFirstList: 'Maak Je Eerste Lijst',
    appearance: 'Weergave',
    notifications: 'Meldingen',
    pushNotifications: 'Pushmeldingen',
    pushNotificationsHint: 'Ontvang een melding als er items worden toegevoegd',
    editName: 'Naam Bewerken',
    save: 'Opslaan',
    cancel: 'Annuleren',
    signOut: 'Uitloggen',
    language: 'Taal',
    profile: 'Profiel',
    lists: 'Lijsten',
  },
  fr: {
    newList: 'Nouvelle Liste',
    joinList: 'Rejoindre',
    noLists: 'Aucune liste',
    noListsSubtitle: 'Créez une nouvelle liste ou rejoignez-en une avec un code d\'invitation.',
    createFirstList: 'Créer Ma Première Liste',
    appearance: 'Apparence',
    notifications: 'Notifications',
    pushNotifications: 'Notifications Push',
    pushNotificationsHint: 'Soyez notifié quand des articles sont ajoutés',
    editName: 'Modifier le Nom',
    save: 'Enregistrer',
    cancel: 'Annuler',
    signOut: 'Se Déconnecter',
    language: 'Langue',
    profile: 'Profil',
    lists: 'Listes',
  },
};

interface LanguageState {
  languageCode: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  languageCode: 'en',
  setLanguage: (code) => set({ languageCode: code }),
  t: (key) => TRANSLATIONS[get().languageCode]?.[key] ?? TRANSLATIONS['en'][key] ?? key,
}));