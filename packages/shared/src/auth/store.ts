import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string, resource?: string) => boolean;
  isAdmin: () => boolean;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User | null) => {
        const { user: currentUser } = get();

        // Use last_login_on or updated_at timestamp to determine which user object is more recent
        // If either user object is missing timestamps, always update
        if (user && currentUser) {
          const newUpdatedAt = user.last_login_on ? new Date(user.last_login_on).getTime() : null;
          const currentUpdatedAt = currentUser.last_login_on ? new Date(currentUser.last_login_on).getTime() : null;

          // Only skip update if both have timestamps and new data is older
          if (
            newUpdatedAt !== null &&
            currentUpdatedAt !== null &&
            newUpdatedAt < currentUpdatedAt
          ) {
            return;
          }
        }

        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string) => {
        set({ token });
        // Also store in localStorage for API client compatibility
        localStorage.setItem('foreman_auth_token', token);
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        });
        // Also store in localStorage for API client compatibility
        localStorage.setItem('foreman_auth_token', token);
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
        // Also remove from localStorage
        localStorage.removeItem('foreman_auth_token');
        localStorage.removeItem('foreman_auth_token_id');
        localStorage.removeItem('foreman_auth_user_id');
        // Clear Zustand persisted state
        localStorage.removeItem('foreman-auth');
        sessionStorage.clear();
      },

      hasPermission: (permission: string, resource?: string) => {
        const { user } = get();

        if (!user) return false;
        if (user.admin) return true;

        // Check explicit permissions from roles
        if (!user.roles || !Array.isArray(user.roles)) return false;

        return user.roles.some(role => {
          if (!role.permissions || !Array.isArray(role.permissions)) return false;

          return role.permissions.some(perm => {
            if (!perm || typeof perm !== 'object') return false;
            const permissionMatch = perm.name === permission;
            const resourceMatch = !resource || perm.resource_type === resource;
            return permissionMatch && resourceMatch;
          });
        });
      },

      isAdmin: () => {
        const { user } = get();
        return user?.admin || false;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'foreman-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        // Don't persist isAuthenticated - it should be determined by token verification
      }),
    }
  )
);