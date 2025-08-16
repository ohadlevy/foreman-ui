/**
 * GraphQL Configuration Management
 * 
 * This module provides centralized configuration for enabling/disabling GraphQL usage
 * across the entire application. When GraphQL is disabled, API clients should fall back
 * to REST endpoints.
 */

// Global state for GraphQL enablement
let globalGraphQLEnabled = true;

/**
 * Set the global GraphQL enabled state
 * This is called from the user settings store when the user toggles the GraphQL setting
 */
export const setGlobalGraphQLEnabled = (enabled: boolean): void => {
  globalGraphQLEnabled = enabled;
  console.debug(`GraphQL globally ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Check if GraphQL is currently enabled globally
 * This is used by API clients to determine whether to use GraphQL or fall back to REST
 */
export const isGraphQLEnabled = (): boolean => {
  return globalGraphQLEnabled;
};

/**
 * React hook for components that need to know the current GraphQL state
 * Note: This returns the current state but doesn't automatically re-render on changes
 * For reactive updates, components should listen to user settings changes
 */
export const useGraphQLConfig = () => {
  return {
    isEnabled: isGraphQLEnabled(),
    setEnabled: setGlobalGraphQLEnabled,
  };
};

/**
 * Initialize GraphQL configuration from user settings
 * This should be called during app initialization
 */
export const initializeGraphQLConfig = (enabled: boolean = true): void => {
  setGlobalGraphQLEnabled(enabled);
};