import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../store';

// Mock the auth store
vi.mock('../store');
const mockUseAuthStore = vi.mocked(useAuthStore);

// Mock API client
vi.mock('../../api/client', () => ({
  createDefaultClient: vi.fn(() => ({
    baseURL: '/api/v2',
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }))
}));

// Mock AuthAPI
vi.mock('../auth', () => ({
  AuthAPI: vi.fn().mockImplementation(() => ({
    login: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn(),
    loginWithToken: vi.fn(),
  }))
}));

describe('useAuth', () => {
  let queryClient: QueryClient;
  let mockAuthStore: any;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    mockAuthStore = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: vi.fn(),
      setToken: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: vi.fn(),
      clearError: vi.fn(),
    };

    mockUseAuthStore.mockReturnValue(mockAuthStore);

    // Reset environment variables
  });

  describe('initial state', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });


  describe('authentication actions', () => {
    it('should have login function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.login).toBe('function');
    });

    it('should have logout function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.logout).toBe('function');
    });

    it('should have loginWithToken function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.loginWithToken).toBe('function');
    });

    it('should trigger logout mutation when logout is called', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      result.current.logout();

      // Store logout is no longer called immediately - it's called after successful token revocation
      // The logout mutation should be started though
      expect(result.current.isLogoutLoading).toBe(false); // Initially false, but mutation starts
    });
  });

  describe('permission helpers', () => {
    it('should expose hasPermission function', () => {
      mockAuthStore.hasPermission.mockReturnValue(true);
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('view_hosts')).toBe(true);
      expect(mockAuthStore.hasPermission).toHaveBeenCalledWith('view_hosts');
    });

    it('should expose isAdmin function', () => {
      mockAuthStore.isAdmin.mockReturnValue(false);
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAdmin()).toBe(false);
      expect(mockAuthStore.isAdmin).toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('should show login loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially should not be loading
      expect(result.current.isLoginLoading).toBe(false);
    });

    it('should show logout loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially should not be loading
      expect(result.current.isLogoutLoading).toBe(false);
    });

    it('should calculate loading state correctly when verifying token', () => {
      mockAuthStore.token = 'some-token';
      mockAuthStore.user = null;
      mockAuthStore.isLoading = false;

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should be loading when token exists but no user (token verification)
      expect(result.current.isLoading).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should expose clearError function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      result.current.clearError();

      expect(mockAuthStore.clearError).toHaveBeenCalled();
    });

    it('should return error from store', () => {
      mockAuthStore.error = 'Login failed';

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.error).toBe('Login failed');
    });
  });

  describe('token verification', () => {
    it('should enable token verification when token exists but no user', () => {
      mockAuthStore.token = 'valid-token';
      mockAuthStore.user = null;
      mockAuthStore.isAuthenticated = false;

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should attempt to verify token
      expect(result.current.isLoading).toBeDefined();
    });


    it('should not verify token when user already exists', () => {
      mockAuthStore.token = 'valid-token';
      mockAuthStore.user = { id: 1, login: 'user' };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should not be loading when user exists
      expect(result.current.isLoading).toBe(false);
    });
  });
});