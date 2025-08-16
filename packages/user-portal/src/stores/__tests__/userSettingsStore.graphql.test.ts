import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the shared GraphQL config function
vi.mock('@foreman/shared', () => {
  return {
    setGlobalGraphQLEnabled: vi.fn(),
  };
});

import { useUserSettingsStore } from '../userSettingsStore';
import { setGlobalGraphQLEnabled } from '@foreman/shared';

// Get the mocked function with proper typing
const mockSetGlobalGraphQLEnabled = vi.mocked(setGlobalGraphQLEnabled);

describe('UserSettingsStore - GraphQL Configuration', () => {
  beforeEach(() => {
    // Reset the store state
    useUserSettingsStore.getState().userSettings = {};
    useUserSettingsStore.getState().currentUserId = null;
    mockSetGlobalGraphQLEnabled.mockClear();
  });

  describe('setEnableGraphQL', () => {
    it('should set GraphQL enablement for current user', () => {
      const store = useUserSettingsStore.getState();
      
      // Set current user
      store.setCurrentUser('testuser');
      
      // Enable GraphQL
      store.setEnableGraphQL(false);
      
      const settings = store.getCurrentUserSettings();
      expect(settings.enableGraphQL).toBe(false);
      expect(mockSetGlobalGraphQLEnabled).toHaveBeenCalledWith(false);
    });

    it('should sync with global GraphQL config', () => {
      const store = useUserSettingsStore.getState();
      
      store.setCurrentUser('testuser');
      store.setEnableGraphQL(true);
      
      expect(mockSetGlobalGraphQLEnabled).toHaveBeenCalledWith(true);
    });

    it('should not update when no current user', () => {
      const store = useUserSettingsStore.getState();
      
      // No current user set
      store.setEnableGraphQL(false);
      
      expect(mockSetGlobalGraphQLEnabled).not.toHaveBeenCalled();
    });
  });

  describe('setCurrentUser with GraphQL sync', () => {
    it('should sync GraphQL setting when setting current user', () => {
      const store = useUserSettingsStore.getState();
      
      // Set a user with explicit GraphQL setting
      store.setCurrentUser('testuser');
      store.setEnableGraphQL(false);
      
      // Switch to another user (should use default)
      store.setCurrentUser('anotheruser');
      
      // Should sync the default value (true)
      expect(mockSetGlobalGraphQLEnabled).toHaveBeenLastCalledWith(true);
    });

    it('should use default GraphQL setting for new users', () => {
      const store = useUserSettingsStore.getState();
      
      store.setCurrentUser('newuser');
      
      const settings = store.getCurrentUserSettings();
      expect(settings.enableGraphQL).toBe(true);
      expect(mockSetGlobalGraphQLEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('updateUserSettings with GraphQL', () => {
    it('should update GraphQL setting through updateUserSettings', () => {
      const store = useUserSettingsStore.getState();
      
      store.setCurrentUser('testuser');
      store.updateUserSettings('testuser', { enableGraphQL: false });
      
      const settings = store.getCurrentUserSettings();
      expect(settings.enableGraphQL).toBe(false);
    });

    it('should handle boolean false explicitly', () => {
      const store = useUserSettingsStore.getState();
      
      store.setCurrentUser('testuser');
      store.updateUserSettings('testuser', { enableGraphQL: false });
      
      const settings = store.getCurrentUserSettings();
      expect(settings.enableGraphQL).toBe(false);
    });

    it('should handle boolean true explicitly', () => {
      const store = useUserSettingsStore.getState();
      
      store.setCurrentUser('testuser');
      store.updateUserSettings('testuser', { enableGraphQL: true });
      
      const settings = store.getCurrentUserSettings();
      expect(settings.enableGraphQL).toBe(true);
    });
  });
});