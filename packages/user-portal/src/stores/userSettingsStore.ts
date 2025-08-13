import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { i18next } from '../i18n';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

// Centralized mapping of language codes to flag emojis
const LANGUAGE_FLAG_EMOJIS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸', 
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  zh: '🇨🇳',
  pt: '🇵🇹',
  ru: '🇷🇺',
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: `${LANGUAGE_FLAG_EMOJIS.en} English` },
  { code: 'es', name: 'Spanish', nativeName: `${LANGUAGE_FLAG_EMOJIS.es} Español` },
  { code: 'fr', name: 'French', nativeName: `${LANGUAGE_FLAG_EMOJIS.fr} Français` },
  { code: 'de', name: 'German', nativeName: `${LANGUAGE_FLAG_EMOJIS.de} Deutsch` },
  { code: 'ja', name: 'Japanese', nativeName: `${LANGUAGE_FLAG_EMOJIS.ja} 日本語` },
  { code: 'zh', name: 'Chinese', nativeName: `${LANGUAGE_FLAG_EMOJIS.zh} 中文` },
  { code: 'pt', name: 'Portuguese', nativeName: `${LANGUAGE_FLAG_EMOJIS.pt} Português` },
  { code: 'ru', name: 'Russian', nativeName: `${LANGUAGE_FLAG_EMOJIS.ru} Русский` },
];

export interface DashboardWidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UserSettings {
  theme: ThemeMode;
  language: string;
  timeZone?: string;
  dashboardLayout?: DashboardWidgetLayout[];
  notificationPreferences?: {
    desktop: boolean;
    email: boolean;
    sound: boolean;
  };
}

interface UserSettingsState {
  userSettings: Record<string, UserSettings>;
  currentUserId: string | null;
  
  // Actions
  setCurrentUser: (userId: string) => void;
  updateUserSettings: (userId: string, settings: Partial<UserSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (language: string) => void;
  updateDashboardLayout: (layout: DashboardWidgetLayout[]) => void;
  getCurrentUserSettings: () => UserSettings;
  getEffectiveTheme: () => 'light' | 'dark';
}

const defaultUserSettings: UserSettings = {
  theme: 'system',
  language: 'en',
  notificationPreferences: {
    desktop: true,
    email: true,
    sound: false,
  },
};

const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      userSettings: {},
      currentUserId: null,
      
      setCurrentUser: (userId: string) => {
        set({ currentUserId: userId });
        
        // Ensure user has settings
        const state = get();
        if (!state.userSettings[userId]) {
          // Create a clean copy of default settings to avoid any potential references
          const cleanDefaultSettings = {
            theme: defaultUserSettings.theme,
            language: defaultUserSettings.language,
            notificationPreferences: {
              desktop: defaultUserSettings.notificationPreferences!.desktop,
              email: defaultUserSettings.notificationPreferences!.email,
              sound: defaultUserSettings.notificationPreferences!.sound,
            },
          };
          
          set({
            userSettings: {
              ...state.userSettings,
              [userId]: cleanDefaultSettings,
            },
          });
        }
        
        // Apply current theme
        const userSettings = state.userSettings[userId] || defaultUserSettings;
        const effectiveTheme = userSettings.theme === 'system' ? getSystemPreference() : userSettings.theme;
        applyThemeToDocument(effectiveTheme);
      },
      
      updateUserSettings: (userId: string, settings: Partial<UserSettings>) => {
        // Ensure we only store serializable data by creating a clean copy
        const cleanSettings: Partial<UserSettings> = {};
        
        if (settings.theme) cleanSettings.theme = settings.theme;
        if (settings.language) cleanSettings.language = settings.language;
        if (settings.timeZone) cleanSettings.timeZone = settings.timeZone;
        if (settings.dashboardLayout) cleanSettings.dashboardLayout = [...settings.dashboardLayout];
        if (settings.notificationPreferences) {
          cleanSettings.notificationPreferences = {
            desktop: Boolean(settings.notificationPreferences.desktop),
            email: Boolean(settings.notificationPreferences.email),
            sound: Boolean(settings.notificationPreferences.sound),
          };
        }
        
        set((state) => ({
          userSettings: {
            ...state.userSettings,
            [userId]: {
              ...state.userSettings[userId],
              ...cleanSettings,
            },
          },
        }));
        
        // If updating current user's theme, apply it
        if (userId === get().currentUserId && cleanSettings.theme) {
          const effectiveTheme = cleanSettings.theme === 'system' ? getSystemPreference() : cleanSettings.theme;
          applyThemeToDocument(effectiveTheme);
        }
      },
      
      setTheme: (theme: ThemeMode) => {
        const { currentUserId } = get();
        if (currentUserId) {
          get().updateUserSettings(currentUserId, { theme });
        }
      },
      
      toggleTheme: () => {
        const currentSettings = get().getCurrentUserSettings();
        let newTheme: ThemeMode;
        
        if (currentSettings.theme === 'light') {
          newTheme = 'dark';
        } else if (currentSettings.theme === 'dark') {
          newTheme = 'system';
        } else {
          newTheme = 'light';
        }
        
        get().setTheme(newTheme);
      },
      
      setLanguage: (language: string) => {
        const { currentUserId } = get();
        if (currentUserId) {
          get().updateUserSettings(currentUserId, { language });
          // Apply language change to i18next with proper error handling
          try {
            i18next.changeLanguage(language);
          } catch (error) {
            // Log errors appropriately based on environment
            if (process.env.NODE_ENV === 'test') {
              console.debug(`Language change to ${language} failed (expected in test environment):`, error);
            } else {
              console.error(`Failed to change language to ${language}:`, error);
            }
          }
        }
      },
      
      updateDashboardLayout: (layout: DashboardWidgetLayout[]) => {
        const { currentUserId } = get();
        if (currentUserId) {
          get().updateUserSettings(currentUserId, { dashboardLayout: layout });
        }
      },
      
      getCurrentUserSettings: () => {
        const { currentUserId, userSettings } = get();
        if (!currentUserId) return defaultUserSettings;
        return userSettings[currentUserId] || defaultUserSettings;
      },
      
      getEffectiveTheme: () => {
        const settings = get().getCurrentUserSettings();
        return settings.theme === 'system' ? getSystemPreference() : settings.theme;
      },
    }),
    {
      name: 'foreman-ui-user-settings',
      // Only persist user settings, not current user ID (that should come from auth)
      partialize: (state) => ({ userSettings: state.userSettings }),
    }
  )
);

export const applyThemeToDocument = (theme: 'light' | 'dark') => {
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.classList.add('pf-v5-theme-dark');
    html.classList.remove('pf-v5-theme-light');
  } else {
    html.classList.add('pf-v5-theme-light');
    html.classList.remove('pf-v5-theme-dark');
  }
};