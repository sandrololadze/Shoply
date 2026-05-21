// src/store/languageStore.ts
import { create } from 'zustand';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇧🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ka', label: 'ქართული', flag: '🇬🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    newList: 'New List', joinList: 'Join List', noLists: 'No lists yet',
    noListsSubtitle: 'Create a new shopping list or join one with an invite code.',
    createFirstList: 'Create Your First List', appearance: 'Appearance',
    notifications: 'Notifications', pushNotifications: 'Push Notifications',
    pushNotificationsHint: 'Get notified when items are added',
    editName: 'Edit Name', save: 'Save', cancel: 'Cancel', signOut: 'Sign Out',
    language: 'Language', profile: 'Profile', lists: 'Lists',
    loadingLists: 'Loading your lists...', guestTitle: 'You are logged in as guest',
    guestSub: 'Create an account to save your data →',
    newShoppingList: 'New Shopping List', listName: 'List Name',
    listNamePlaceholder: 'e.g. Weekly Groceries', descriptionOptional: 'Description (optional)',
    descriptionPlaceholder: "What's this list for?", createList: 'Create List',
    joinAList: 'Join a List', joinHint: 'Ask your friend for the invite code from their list.',
    inviteCode: 'Invite Code',
  },
  nl: {
    newList: 'Nieuwe Lijst', joinList: 'Lijst Joinen', noLists: 'Nog geen lijsten',
    noListsSubtitle: 'Maak een nieuwe boodschappenlijst of join er één met een uitnodigingscode.',
    createFirstList: 'Maak Je Eerste Lijst', appearance: 'Weergave',
    notifications: 'Meldingen', pushNotifications: 'Pushmeldingen',
    pushNotificationsHint: 'Ontvang een melding als er items worden toegevoegd',
    editName: 'Naam Bewerken', save: 'Opslaan', cancel: 'Annuleren', signOut: 'Uitloggen',
    language: 'Taal', profile: 'Profiel', lists: 'Lijsten',
    loadingLists: 'Lijsten laden...', guestTitle: 'Je bent ingelogd als gast',
    guestSub: 'Maak een account aan om je data te bewaren →',
    newShoppingList: 'Nieuwe Boodschappenlijst', listName: 'Naam van de lijst',
    listNamePlaceholder: 'bv. Weekboodschappen', descriptionOptional: 'Beschrijving (optioneel)',
    descriptionPlaceholder: 'Waarvoor is deze lijst?', createList: 'Lijst Aanmaken',
    joinAList: 'Een Lijst Joinen', joinHint: 'Vraag je vriend om de uitnodigingscode van hun lijst.',
    inviteCode: 'Uitnodigingscode',
  },
  fr: {
    newList: 'Nouvelle Liste', joinList: 'Rejoindre', noLists: 'Aucune liste',
    noListsSubtitle: "Créez une nouvelle liste ou rejoignez-en une avec un code d'invitation.",
    createFirstList: 'Créer Ma Première Liste', appearance: 'Apparence',
    notifications: 'Notifications', pushNotifications: 'Notifications Push',
    pushNotificationsHint: 'Soyez notifié quand des articles sont ajoutés',
    editName: 'Modifier le Nom', save: 'Enregistrer', cancel: 'Annuler', signOut: 'Se Déconnecter',
    language: 'Langue', profile: 'Profil', lists: 'Listes',
    loadingLists: 'Chargement...', guestTitle: 'Vous êtes connecté en tant qu\'invité',
    guestSub: 'Créez un compte pour sauvegarder vos données →',
    newShoppingList: 'Nouvelle Liste de Courses', listName: 'Nom de la liste',
    listNamePlaceholder: 'ex. Courses de la semaine', descriptionOptional: 'Description (optionnel)',
    descriptionPlaceholder: 'À quoi sert cette liste?', createList: 'Créer la Liste',
    joinAList: 'Rejoindre une Liste', joinHint: 'Demandez le code d\'invitation à votre ami.',
    inviteCode: 'Code d\'invitation',
  },
  ka: {
    newList: 'ახალი სია', joinList: 'სიაში შეერთება', noLists: 'სიები არ არის',
    noListsSubtitle: 'შექმენი ახალი სასყიდლების სია ან შეუერთდი მოწვევის კოდით.',
    createFirstList: 'შექმენი პირველი სია', appearance: 'გარეგნობა',
    notifications: 'შეტყობინებები', pushNotifications: 'პუშ შეტყობინებები',
    pushNotificationsHint: 'მიიღე შეტყობინება როცა ემატება ნივთები',
    editName: 'სახელის შეცვლა', save: 'შენახვა', cancel: 'გაუქმება', signOut: 'გასვლა',
    language: 'ენა', profile: 'პროფილი', lists: 'სიები',
    loadingLists: 'სიები იტვირთება...', guestTitle: 'შესული ხარ სტუმრად',
    guestSub: 'შექმენი ანგარიში მონაცემების შესანახად →',
    newShoppingList: 'ახალი სასყიდლების სია', listName: 'სიის სახელი',
    listNamePlaceholder: 'მაგ. კვირის სასყიდლები', descriptionOptional: 'აღწერა (სურვილისამებრ)',
    descriptionPlaceholder: 'რისთვისაა ეს სია?', createList: 'სიის შექმნა',
    joinAList: 'სიაში შეერთება', joinHint: 'სთხოვე მეგობარს მოწვევის კოდი.',
    inviteCode: 'მოწვევის კოდი',
  },
  ru: {
    newList: 'Новый список', joinList: 'Присоединиться', noLists: 'Списков пока нет',
    noListsSubtitle: 'Создайте новый список покупок или присоединитесь по коду приглашения.',
    createFirstList: 'Создать первый список', appearance: 'Внешний вид',
    notifications: 'Уведомления', pushNotifications: 'Push-уведомления',
    pushNotificationsHint: 'Получать уведомления при добавлении товаров',
    editName: 'Изменить имя', save: 'Сохранить', cancel: 'Отмена', signOut: 'Выйти',
    language: 'Язык', profile: 'Профиль', lists: 'Списки',
    loadingLists: 'Загрузка списков...', guestTitle: 'Вы вошли как гость',
    guestSub: 'Создайте аккаунт чтобы сохранить данные →',
    newShoppingList: 'Новый список покупок', listName: 'Название списка',
    listNamePlaceholder: 'напр. Продукты на неделю', descriptionOptional: 'Описание (необязательно)',
    descriptionPlaceholder: 'Для чего этот список?', createList: 'Создать список',
    joinAList: 'Присоединиться к списку', joinHint: 'Попросите друга дать код приглашения.',
    inviteCode: 'Код приглашения',
  },
};

interface LanguageState {
  languageCode: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
}

const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('shoply-language') ?? 'en';
  }
  return 'en';
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  languageCode: getSavedLanguage(),
  setLanguage: (code) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shoply-language', code);
    }
    set({ languageCode: code });
  },
  t: (key) => TRANSLATIONS[get().languageCode]?.[key] ?? TRANSLATIONS['en'][key] ?? key,
}));