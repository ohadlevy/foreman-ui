/**
 * GraphQL configuration management
 * 
 * Since user settings are managed in the user-portal package,
 * we'll create a simple configuration system that can be used
 * across packages without tight coupling.
 */

// Global GraphQL configuration state - start with null to force localStorage check
let globalGraphQLEnabled: boolean | null = null;

/**
 * Set the global GraphQL enablement state
 * This should be called by the user portal when settings change
 */
export const setGlobalGraphQLEnabled = (enabled: boolean): void => {
  globalGraphQLEnabled = enabled;
};

/**
 * Get the current GraphQL enablement state
 * This checks the actual user settings from localStorage if available,
 * falling back to the global state variable
 */
export const isGraphQLEnabled = (): boolean => {
  // Try to get the current setting from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const userSettingsState = localStorage.getItem('foreman-ui-user-settings');
      console.debug('GraphQL config check - localStorage:', userSettingsState ? 'found' : 'not found');
      
      if (userSettingsState) {
        const parsed = JSON.parse(userSettingsState);
        console.debug('GraphQL config check - parsed:', parsed);
        
        // The persisted structure is { state: { userSettings: { [userId]: settings } } }
        // But we don't have currentUserId persisted, so we need to check all users or use global state
        const state = parsed?.state || parsed; // Handle both potential structures
        const userSettings = state?.userSettings;
        
        if (userSettings && typeof userSettings === 'object') {
          // Check all users' settings for GraphQL preference
          // If any user has GraphQL disabled, respect that (most restrictive)
          for (const userId in userSettings) {
            const settings = userSettings[userId];
            if (settings && typeof settings.enableGraphQL === 'boolean') {
              console.debug('GraphQL config check - enableGraphQL from localStorage:', settings.enableGraphQL);
              return settings.enableGraphQL;
            }
          }
        }
      }
    } catch (error) {
      // If localStorage parsing fails, fall back to global variable
      console.debug('Could not read GraphQL setting from localStorage:', error);
    }
  }
  
  // Fallback to global variable (set by user settings store)
  // If global variable is null, default to true (GraphQL enabled)
  const fallbackValue = globalGraphQLEnabled ?? true;
  console.debug('GraphQL config check - fallback value:', fallbackValue);
  return fallbackValue;
};

/**
 * Hook to check if GraphQL is enabled
 * Provides centralized control over GraphQL usage across the application
 */
export const useGraphQLConfig = () => {
  return {
    isGraphQLEnabled: globalGraphQLEnabled,
    shouldUseGraphQL: globalGraphQLEnabled, // Alias for clarity
  };
};

/**
 * Hook to access GraphQL config setter (for settings UI)
 */
export const useGraphQLConfigActions = () => {
  return {
    setGraphQLEnabled: setGlobalGraphQLEnabled,
  };
};