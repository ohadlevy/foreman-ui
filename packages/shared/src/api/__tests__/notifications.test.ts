import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationAPI } from '../notifications';
import { createForemanClient } from '../client';

// Mock the client
vi.mock('../client');

const mockCreateForemanClient = vi.mocked(createForemanClient);
const mockClient = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
};

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('NotificationAPI', () => {
  let notificationAPI: NotificationAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateForemanClient.mockReturnValue(mockClient as any);
    mockLocalStorage.getItem.mockReturnValue('test-token');

    notificationAPI = new NotificationAPI();
  });

  describe('constructor', () => {
    it('creates client with empty baseURL and token from localStorage', () => {
      expect(mockCreateForemanClient).toHaveBeenCalledWith({
        baseURL: '',
        token: 'test-token',
      });
    });

    it('creates client without token when not in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      new NotificationAPI();

      expect(mockCreateForemanClient).toHaveBeenCalledWith({
        baseURL: '',
        token: undefined,
      });
    });
  });

  describe('updateToken', () => {
    it('sets token when available in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('new-token');

      notificationAPI.updateToken();

      expect(mockClient.setToken).toHaveBeenCalledWith('new-token');
    });

    it('clears token when not in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      notificationAPI.updateToken();

      expect(mockClient.clearToken).toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('fetches notifications from correct endpoint', async () => {
      const mockResponse = {
        notifications: [
          {
            id: 1,
            seen: false,
            level: 'info' as const,
            text: 'Test notification',
            created_at: '2024-01-01T10:00:00Z',
            group: 'system',
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await notificationAPI.getNotifications();

      expect(mockClient.get).toHaveBeenCalledWith('/notification_recipients');
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockClient.get.mockRejectedValue(error);

      await expect(notificationAPI.getNotifications()).rejects.toThrow('API Error');
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      mockClient.put.mockResolvedValue(undefined);

      await notificationAPI.markAsRead(1);

      expect(mockClient.put).toHaveBeenCalledWith('/notification_recipients/1', { seen: true });
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockClient.put.mockRejectedValue(error);

      await expect(notificationAPI.markAsRead(1)).rejects.toThrow('API Error');
    });
  });

  describe('clearNotification', () => {
    it('deletes notification', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await notificationAPI.clearNotification(1);

      expect(mockClient.delete).toHaveBeenCalledWith('/notification_recipients/1');
    });

    it('handles API errors', async () => {
      const error = new Error('API Error');
      mockClient.delete.mockRejectedValue(error);

      await expect(notificationAPI.clearNotification(1)).rejects.toThrow('API Error');
    });
  });

  describe('markGroupAsRead', () => {
    it('marks group as read with encoded group name', async () => {
      mockClient.put.mockResolvedValue(undefined);

      await notificationAPI.markGroupAsRead('system alerts');

      expect(mockClient.put).toHaveBeenCalledWith('/notification_recipients/group/system%20alerts');
    });

    it('handles special characters in group name', async () => {
      mockClient.put.mockResolvedValue(undefined);

      await notificationAPI.markGroupAsRead('system/alerts & warnings');

      expect(mockClient.put).toHaveBeenCalledWith('/notification_recipients/group/system%2Falerts%20%26%20warnings');
    });
  });

  describe('clearGroup', () => {
    it('deletes all notifications in group', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await notificationAPI.clearGroup('system');

      expect(mockClient.delete).toHaveBeenCalledWith('/notification_recipients/group/system');
    });

    it('handles special characters in group name', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await notificationAPI.clearGroup('system/alerts & warnings');

      expect(mockClient.delete).toHaveBeenCalledWith('/notification_recipients/group/system%2Falerts%20%26%20warnings');
    });
  });
});