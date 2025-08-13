// Mock DOM methods before importing anything
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock document.documentElement
Object.defineProperty(document, 'documentElement', {
  writable: true,
  value: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
});

// Mock i18next
const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
vi.mock('../i18n', () => ({
  i18next: {
    changeLanguage: mockChangeLanguage,
    language: 'en',
    languages: ['en', 'es', 'fr'],
    options: {
      fallbackLng: 'en',
    },
  },
}));

import { renderHook, act } from '@testing-library/react';
import { useUserSettingsStore, SUPPORTED_LANGUAGES } from '../userSettingsStore';

describe('useUserSettingsStore', () => {
  beforeEach(() => {
    // Clear all mocks and reset store
    vi.clearAllMocks();
    useUserSettingsStore.getState().userSettings = {};
    useUserSettingsStore.getState().currentUserId = null;
  });

  describe('user management', () => {
    it('should set current user and initialize settings', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      act(() => {
        result.current.setCurrentUser('user123');
      });

      expect(result.current.currentUserId).toBe('user123');
      expect(result.current.userSettings['user123']).toBeDefined();
      expect(result.current.userSettings['user123'].theme).toBe('system');
      expect(result.current.userSettings['user123'].language).toBe('en');
    });

    it('should return default settings for non-existent user', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      const settings = result.current.getCurrentUserSettings();
      
      expect(settings.theme).toBe('system');
      expect(settings.language).toBe('en');
      expect(settings.notificationPreferences?.desktop).toBe(true);
    });
  });

  describe('theme management', () => {
    it('should update theme for current user', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      act(() => {
        result.current.setCurrentUser('user123');
        result.current.setTheme('dark');
      });

      const settings = result.current.getCurrentUserSettings();
      expect(settings.theme).toBe('dark');
    });

    it('should toggle theme in correct order', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      act(() => {
        result.current.setCurrentUser('user123');
      });

      // Start with system -> light
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.getCurrentUserSettings().theme).toBe('light');

      // light -> dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.getCurrentUserSettings().theme).toBe('dark');

      // dark -> system
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.getCurrentUserSettings().theme).toBe('system');
    });

    it('should return effective theme based on mode', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      act(() => {
        result.current.setCurrentUser('user123');
        result.current.setTheme('light');
      });

      expect(result.current.getEffectiveTheme()).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.getEffectiveTheme()).toBe('dark');
    });
  });

  describe('language management', () => {
    it('should update language', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      act(() => {
        result.current.setCurrentUser('user123');
        result.current.setLanguage('es');
      });

      const settings = result.current.getCurrentUserSettings();
      expect(settings.language).toBe('es');
      // Note: i18next.changeLanguage is wrapped in try-catch for test environment compatibility
    });

    it('should validate supported languages', () => {
      expect(SUPPORTED_LANGUAGES).toContainEqual({
        code: 'en',
        name: 'English',
        nativeName: '🇺🇸 English'
      });
      
      expect(SUPPORTED_LANGUAGES).toContainEqual({
        code: 'es',
        name: 'Spanish',
        nativeName: '🇪🇸 Español'
      });
    });
  });

  describe('dashboard layout management', () => {
    it('should update dashboard layout for current user', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      const testLayout = [
        { id: 'widget1', x: 0, y: 0, w: 1, h: 1 },
        { id: 'widget2', x: 1, y: 0, w: 1, h: 1 },
      ];

      act(() => {
        result.current.setCurrentUser('user123');
        result.current.updateDashboardLayout(testLayout);
      });

      const settings = result.current.getCurrentUserSettings();
      expect(settings.dashboardLayout).toEqual(testLayout);
    });
  });

  describe('settings update', () => {
    it('should update multiple settings at once', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      act(() => {
        result.current.setCurrentUser('user123');
        result.current.updateUserSettings('user123', {
          theme: 'dark',
          language: 'fr',
          notificationPreferences: {
            desktop: false,
            email: true,
            sound: true,
          },
        });
      });

      const settings = result.current.getCurrentUserSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.language).toBe('fr');
      expect(settings.notificationPreferences?.desktop).toBe(false);
      expect(settings.notificationPreferences?.sound).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should maintain separate settings for different users', () => {
      const { result } = renderHook(() => useUserSettingsStore());
      
      // Set up user1
      act(() => {
        result.current.setCurrentUser('user1');
        result.current.setTheme('dark');
        result.current.setLanguage('es');
      });

      // Set up user2
      act(() => {
        result.current.setCurrentUser('user2');
        result.current.setTheme('light');
        result.current.setLanguage('fr');
      });

      // Check user2 settings
      expect(result.current.getCurrentUserSettings().theme).toBe('light');
      expect(result.current.getCurrentUserSettings().language).toBe('fr');

      // Switch back to user1
      act(() => {
        result.current.setCurrentUser('user1');
      });

      // Check user1 settings are preserved
      expect(result.current.getCurrentUserSettings().theme).toBe('dark');
      expect(result.current.getCurrentUserSettings().language).toBe('es');
    });
  });
});