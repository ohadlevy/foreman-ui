import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthAPI } from '../../api/auth';
import { ForemanAPIClient } from '../../api/client';

// Mock the API client
vi.mock('../../api/client');

describe('AuthAPI', () => {
  let mockClient: any;
  let authAPI: AuthAPI;

  beforeEach(() => {
    mockClient = {
      baseURL: '/api/v2',
      get: vi.fn(),
      post: vi.fn(),
      clearToken: vi.fn(),
      setLoggingOut: vi.fn(),
    };
    authAPI = new AuthAPI(mockClient);
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 5,
        login: 'ohad',
        firstname: 'Ohad',
        lastname: 'Anaf Levy',
        mail: 'ohadlevy@gmail.com',
        admin: false,
        disabled: false,
        roles: [],
        organizations: [],
        locations: []
      };

      // Mock the ForemanAPIClient constructor with both get and post methods
      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockResolvedValue(mockUser),
        post: vi.fn().mockResolvedValue({
          token_value: 'generated_personal_access_token_123',
          id: 1,
          name: 'Foreman UI - 2025-08-01T18:00:00.000Z'
        }),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      const result = await authAPI.login({
        login: 'ohad',
        password: 'secret'
      });

      expect(result.user).toEqual(expect.objectContaining({
        id: 5,
        login: 'ohad',
        firstname: 'Ohad',
        lastname: 'Anaf Levy',
        admin: false
      }));
      expect(result.token).toBe('generated_personal_access_token_123');
    });

    it('should throw error for invalid credentials', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { error: { message: 'Unable to authenticate user invalid' } }
        }
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn().mockRejectedValue(mockError),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      await expect(authAPI.login({
        login: 'invalid',
        password: 'wrong'
      })).rejects.toThrow('Invalid username or password. Please try again.');
    });

    it('should handle 403 forbidden error', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { error: { message: 'Access forbidden' } }
        }
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn().mockRejectedValue(mockError),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      await expect(authAPI.login({
        login: 'disabled',
        password: 'password'
      })).rejects.toThrow('Access denied. Your account may be disabled.');
    });

    it('should handle server errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } }
        }
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn().mockRejectedValue(mockError),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      await expect(authAPI.login({
        login: 'user',
        password: 'password'
      })).rejects.toThrow('Server error (500). Please try again later or contact support.');
    });

    it('should handle network errors', async () => {
      const mockError = {
        code: 'NETWORK_ERROR',
        message: 'Network error'
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn().mockRejectedValue(mockError),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      await expect(authAPI.login({
        login: 'user',
        password: 'password'
      })).rejects.toThrow('Network error. Please check your connection and Foreman server URL.');
    });
  });

  describe('logout', () => {
    it('should clear token and localStorage', async () => {
      const mockLocalStorage = {
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      await authAPI.logout();

      expect(mockClient.clearToken).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('foreman_auth_token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockUser = {
        id: 5,
        login: 'ohad',
        firstname: 'Ohad',
        lastname: 'Anaf Levy',
        mail: 'ohadlevy@gmail.com',
        admin: false,
        disabled: false,
        roles: [],
        organizations: [],
        locations: []
      };

      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('valid_personal_access_token')
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockResolvedValue(mockUser),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      const result = await authAPI.verifyToken();

      expect(result).toEqual(expect.objectContaining({
        id: 5,
        login: 'ohad',
        firstname: 'Ohad',
        lastname: 'Anaf Levy'
      }));
    });

    it('should throw error for no stored token', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null)
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      await expect(authAPI.verifyToken()).rejects.toThrow('No stored token');
    });

    it('should throw error for invalid token', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('invalid_personal_access_token')
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      const mockError = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid token' } }
        }
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError),
        setLoggingOut: vi.fn(),
        clearToken: vi.fn()
      }));

      await expect(authAPI.verifyToken()).rejects.toThrow();
    });
  });
});