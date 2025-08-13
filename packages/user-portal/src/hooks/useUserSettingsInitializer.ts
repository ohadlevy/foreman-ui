import { useEffect, useMemo } from 'react';
import { useAuth } from '@foreman/shared';
import { useUserSettingsStore } from '../stores/userSettingsStore';
import { useSystemThemeListener } from './useSystemThemeListener';

/**
 * Hook that initializes user settings when a user logs in
 * This hook should be used at the app level to ensure user settings
 * are properly initialized when authentication state changes
 */
export const useUserSettingsInitializer = () => {
  const { user, isAuthenticated } = useAuth();
  const { setCurrentUser, getCurrentUserSettings } = useUserSettingsStore();
  
  // Initialize system theme listener
  useSystemThemeListener();

  // Memoize the i18n import promise to prevent re-imports on every render
  const i18nImportPromise = useMemo(() => import('../i18n'), []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Set the current user in the settings store
      setCurrentUser(user.id.toString());
      
      // Apply the user's language preference
      const settings = getCurrentUserSettings();
      if (settings.language) {
        // Use memoized i18n import to avoid re-importing on every render
        i18nImportPromise.then(({ i18next }) => {
          // Add error handling for test environment compatibility
          try {
            i18next.changeLanguage(settings.language);
          } catch (error) {
            // Log errors appropriately based on environment
            if (process.env.NODE_ENV === 'test') {
              console.debug(`Language change to ${settings.language} failed (expected in test environment):`, error);
            } else {
              console.error(`Failed to change language to ${settings.language}:`, error);
            }
          }
        }).catch(error => {
          // Handle import failures with proper error logging
          if (process.env.NODE_ENV === 'test') {
            console.debug('i18n import failed (expected in test environment):', error);
          } else {
            console.error('Failed to import i18n module:', error);
          }
        });
      }
    }
  }, [isAuthenticated, user?.id, setCurrentUser, getCurrentUserSettings, i18nImportPromise]);
};