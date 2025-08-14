import { useEffect } from 'react';
import { useUserSettingsStore, applyThemeToDocument } from '../stores/userSettingsStore';

/**
 * Hook that listens for system theme changes and applies them
 * when the user has selected 'system' theme mode
 */
export const useSystemThemeListener = () => {
  const { getCurrentUserSettings, getEffectiveTheme } = useUserSettingsStore();

  useEffect(() => {
    // Apply initial theme on component mount
    const effectiveTheme = getEffectiveTheme();
    applyThemeToDocument(effectiveTheme);

    // Only add listener if window.matchMedia is available
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const handleSystemThemeChange = () => {
      const currentSettings = getCurrentUserSettings();
      if (currentSettings.theme === 'system') {
        const effectiveTheme = getEffectiveTheme();
        applyThemeToDocument(effectiveTheme);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [getCurrentUserSettings, getEffectiveTheme]);
};