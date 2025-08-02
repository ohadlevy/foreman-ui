import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthAPI } from '../../api/auth';
import { ForemanAPIClient } from '../../api/client';

// Mock the API client
vi.mock('../../api/client');

describe('Foreman Authentication Flow', () => {
  let mockClient: any;
  let authAPI: AuthAPI;

  beforeEach(() => {
    mockClient = {
      baseURL: '/api/v2',
      get: vi.fn(),
      post: vi.fn(),
      clearToken: vi.fn(),
    };
    authAPI = new AuthAPI(mockClient);
  });

  describe('Core UI Authentication Flow', () => {
    it('should authenticate valid user and generate token', async () => {
      const validUser = {
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        mail: 'test@example.com',
        admin: false,
        disabled: false,
        roles: [],
        organizations: [],
        locations: []
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockResolvedValue(validUser),
        post: vi.fn().mockResolvedValue({
          token: 'generated_personal_access_token_123',
          id: 1,
          name: 'Foreman UI Token'
        })
      }));

      const result = await authAPI.login({
        login: 'testuser',
        password: 'validpassword'
      });

      expect(result.user).toEqual(expect.objectContaining({
        login: 'testuser',
        id: 1
      }));
      expect(result.token).toBe('generated_personal_access_token_123');
    });

    it('should reject invalid credentials', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid credentials'
            }
          }
        }
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError),
        post: vi.fn().mockRejectedValue(mockError)
      }));

      await expect(authAPI.login({
        login: 'invalid',
        password: 'wrong'
      })).rejects.toThrow('Invalid username or password. Please try again.');
    });
  });

  describe('Token Validation', () => {
    it('should verify valid token', async () => {
      const tokenUser = {
        id: 1,
        login: 'user',
        firstname: 'Test',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        roles: [],
        organizations: [],
        locations: []
      };

      mockClient.get.mockResolvedValue(tokenUser);
      mockClient.setToken = vi.fn();

      const result = await authAPI.loginWithToken('valid_token_123');

      expect(result).toEqual(expect.objectContaining({
        login: 'user',
        id: 1
      }));
      expect(mockClient.setToken).toHaveBeenCalledWith('valid_token_123');
    });

    it('should reject invalid token', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid token'
            }
          }
        }
      };

      mockClient.get.mockRejectedValue(mockError);

      await expect(authAPI.loginWithToken('invalid_token')).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should verify stored token', async () => {
      const user = {
        id: 1,
        login: 'user',
        firstname: 'Test',
        lastname: 'User',
        mail: 'user@example.com',
        admin: false,
        disabled: false,
        roles: [],
        organizations: [],
        locations: []
      };

      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('valid_stored_token')
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockResolvedValue(user)
      }));

      const result = await authAPI.verifyToken();

      expect(result).toEqual(expect.objectContaining({
        login: 'user',
        id: 1
      }));
    });

    it('should handle expired token', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('expired_token')
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      const mockError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Token expired'
            }
          }
        }
      };

      (ForemanAPIClient as any).mockImplementation(() => ({
        get: vi.fn().mockRejectedValue(mockError)
      }));

      await expect(authAPI.verifyToken()).rejects.toThrow();
    });
  });
});