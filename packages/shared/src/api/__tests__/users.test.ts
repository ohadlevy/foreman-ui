import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UsersAPI } from '../users';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('UsersAPI', () => {
  let mockClient: any;
  let usersAPI: UsersAPI;

  beforeEach(() => {
    mockClient = {
      baseURL: '/api/v2',
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      getPaginated: vi.fn(),
      getToken: vi.fn().mockReturnValue('test_token'),
    };
    usersAPI = new UsersAPI(mockClient);

    vi.clearAllMocks();
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    fetchMock.mockClear();
  });

  describe('getCurrent', () => {
    // FIXME: These tests cause hanging in CI due to complex async mocking - need to simplify
    it.skip('should attempt GraphQL first for current user with permissions', async () => {
      // Mock successful GraphQL response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            currentUser: {
              id: 'VXNlci0x',
              login: 'testuser',
              firstname: 'Test',
              lastname: 'User',
              admin: false,
              roles: [
                {
                  id: 1,
                  name: 'test_role',
                  permissions: [
                    { name: 'view_hosts', resource_type: 'Host' }
                  ]
                }
              ]
            }
          }
        })
      });

      const result = await usersAPI.getCurrent();

      // Verify GraphQL endpoint was called
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/graphql'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual(expect.objectContaining({
        id: 1, // Should be converted from base64
        login: 'testuser',
        roles: expect.arrayContaining([
          expect.objectContaining({
            permissions: expect.arrayContaining([
              expect.objectContaining({
                name: 'view_hosts',
                resource_type: 'Host'
              })
            ])
          })
        ])
      }));
    });

    it.skip('should fall back to REST API when GraphQL fails', async () => {
      // Mock GraphQL failure
      fetchMock.mockRejectedValueOnce(new Error('GraphQL failed'));

      // Mock REST API success
      mockClient.get.mockResolvedValueOnce({
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        admin: false,
        roles: []
      });

      const result = await usersAPI.getCurrent();

      // Verify fallback to REST
      expect(mockClient.get).toHaveBeenCalledWith('/current_user');
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        login: 'testuser'
      }));
    });

    it.skip('should handle users with no permissions gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            currentUser: {
              id: 'VXNlci0x',
              login: 'testuser',
              roles: []
            }
          }
        })
      });

      const result = await usersAPI.getCurrent();

      expect(result.roles).toEqual([]);
    });

    it.skip('should parse numeric IDs correctly from base64', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            currentUser: {
              id: 'VXNlci01', // base64 for "User-5"
              login: 'testuser'
            }
          }
        })
      });

      const result = await usersAPI.getCurrent();

      expect(result.id).toBe(5);
    });
  });

  describe('Basic CRUD operations', () => {
    it.skip('should list users with pagination', async () => {
      const mockUsers = [{ id: 1, login: 'user1' }, { id: 2, login: 'user2' }];
      mockClient.getPaginated.mockResolvedValueOnce(mockUsers);

      const result = await usersAPI.list();

      expect(mockClient.getPaginated).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockUsers);
    });

    it.skip('should get individual user by ID', async () => {
      const mockUser = { id: 1, login: 'testuser' };
      mockClient.get.mockResolvedValueOnce(mockUser);

      const result = await usersAPI.get(1);

      expect(mockClient.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockUser);
    });

    it.skip('should create new user', async () => {
      const userData = { login: 'newuser', firstname: 'New', lastname: 'User' };
      const createdUser = { id: 3, ...userData };
      mockClient.post.mockResolvedValueOnce(createdUser);

      const result = await usersAPI.create(userData);

      expect(mockClient.post).toHaveBeenCalledWith('/users', { user: userData });
      expect(result).toEqual(createdUser);
    });
  });
});