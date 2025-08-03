import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store';
import { act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user and update authentication status', () => {
      const mockUser = {
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        mail: 'test@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set authentication to false when user is null', () => {
      act(() => {
        useAuthStore.getState().setUser(null as any);
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setToken', () => {
    it('should set token and store in localStorage', () => {
      const token = 'test-token';

      act(() => {
        useAuthStore.getState().setToken(token);
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe(token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('foreman_auth_token', token);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      act(() => {
        useAuthStore.getState().setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Login failed';

      act(() => {
        useAuthStore.getState().setError(errorMessage);
      });

      expect(useAuthStore.getState().error).toBe(errorMessage);
    });

    it('should clear error when set to null', () => {
      act(() => {
        useAuthStore.getState().setError('Error');
        useAuthStore.getState().setError(null);
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('login', () => {
    it('should set user, token, and authentication status', () => {
      const mockUser = {
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        mail: 'test@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };
      const token = 'auth-token';

      act(() => {
        useAuthStore.getState().login(mockUser, token);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('foreman_auth_token', token);
    });
  });

  describe('logout', () => {
    it('should clear all auth state and localStorage', () => {
      // First login
      const mockUser = {
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        mail: 'test@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().login(mockUser, 'token');
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('foreman_auth_token');
    });
  });

  describe('hasPermission', () => {
    it('should return false for unauthenticated user', () => {
      const hasPermission = useAuthStore.getState().hasPermission('view_hosts');
      expect(hasPermission).toBe(false);
    });

    it('should handle permission checks during user loading states', () => {
      // Test when user is explicitly null (loading state)
      act(() => {
        useAuthStore.getState().setUser(null);
      });
      
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(false);
      expect(useAuthStore.getState().hasPermission('view_hosts', 'Host')).toBe(false);
    });

    it('should handle empty user objects gracefully', () => {
      const emptyUser = {};
      
      act(() => {
        useAuthStore.getState().setUser(emptyUser as any);
      });
      
      // Should not crash and should return false
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(false);
    });

    it('should handle user objects with missing roles', () => {
      const userWithoutRoles = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        // no roles field - this can happen during partial API responses
        organizations: [],
        locations: []
      };
      
      act(() => {
        useAuthStore.getState().setUser(userWithoutRoles as any);
      });
      
      // Should not crash and should return false
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(false);
    });

    it('should return true for admin user', () => {
      const adminUser = {
        id: 1,
        login: 'admin',
        firstname: 'Admin',
        lastname: 'User',
        mail: 'admin@example.com',
        admin: true,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(adminUser);
      });

      const hasPermission = useAuthStore.getState().hasPermission('any_permission');
      expect(hasPermission).toBe(true);
    });

    it('should check specific permissions for non-admin user', () => {
      const regularUser = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [{
          id: 1,
          name: 'Viewer',
          builtin: false,
          permissions: [
            { id: 1, name: 'view_hosts', resource_type: 'Host' },
            { id: 2, name: 'view_users', resource_type: 'User' }
          ]
        }],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(regularUser);
      });

      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(true);
      expect(useAuthStore.getState().hasPermission('view_hosts', 'Host')).toBe(true);
      expect(useAuthStore.getState().hasPermission('edit_hosts')).toBe(false);
      expect(useAuthStore.getState().hasPermission('view_hosts', 'User')).toBe(false);
    });

    it('should handle roles with undefined permissions gracefully', () => {
      const userWithBadRole = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [{
          id: 1,
          name: 'BadRole',
          builtin: false
          // no permissions field - this happens in real API responses
        }],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(userWithBadRole);
      });

      // Should not crash and should return false
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(false);
      expect(useAuthStore.getState().hasPermission('edit_hosts')).toBe(false);
    });

    it('should handle roles with null permissions gracefully', () => {
      const userWithNullPermissions = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [{
          id: 1,
          name: 'NullPermissionsRole',
          builtin: false,
          permissions: null // null instead of array
        }],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(userWithNullPermissions);
      });

      // Should not crash and should return false
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(false);
    });

    it('should handle roles with malformed permissions gracefully', () => {
      const userWithMalformedPermissions = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [{
          id: 1,
          name: 'MalformedRole',
          builtin: false,
          permissions: 'not-an-array' // wrong type
        }],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(userWithMalformedPermissions);
      });

      // Should not crash and should return false
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(false);
    });

    it('should handle permission objects with missing properties', () => {
      const userWithMalformedPerms = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [{
          id: 1,
          name: 'MalformedPermsRole',
          builtin: false,
          permissions: [
            null, // null permission object
            undefined, // undefined permission object
            { id: 1 }, // missing name and resource_type
            { name: 'view_hosts' }, // missing resource_type (should still work)
            'not-an-object' // wrong type
          ]
        }],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(userWithMalformedPerms);
      });

      // Should not crash - the valid permission should work
      expect(useAuthStore.getState().hasPermission('view_hosts')).toBe(true);
      expect(useAuthStore.getState().hasPermission('edit_hosts')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false for non-admin user', () => {
      const regularUser = {
        id: 1,
        login: 'user',
        firstname: 'Regular',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(regularUser);
      });

      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });

    it('should return true for admin user', () => {
      const adminUser = {
        id: 1,
        login: 'admin',
        firstname: 'Admin',
        lastname: 'User',
        mail: 'admin@example.com',
        admin: true,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };

      act(() => {
        useAuthStore.getState().setUser(adminUser);
      });

      expect(useAuthStore.getState().isAdmin()).toBe(true);
    });

    it('should return false when no user is logged in', () => {
      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      act(() => {
        useAuthStore.getState().setError('Some error');
        useAuthStore.getState().clearError();
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});