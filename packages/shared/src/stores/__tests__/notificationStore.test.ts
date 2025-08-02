import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore, NotificationRecipient } from '../notificationStore';

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

describe('notificationStore', () => {
  const sampleNotifications: NotificationRecipient[] = [
    {
      id: 1,
      seen: false,
      level: 'info',
      text: 'Test notification 1',
      created_at: '2024-01-01T10:00:00Z',
      group: 'system',
    },
    {
      id: 2,
      seen: true,
      level: 'warning',
      text: 'Test notification 2',
      created_at: '2024-01-01T11:00:00Z',
      group: 'system',
    },
    {
      id: 3,
      seen: false,
      level: 'error',
      text: 'Test notification 3',
      created_at: '2024-01-01T12:00:00Z',
      group: 'deployment',
    },
  ];

  beforeEach(() => {
    // Reset the store
    useNotificationStore.setState({
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastPolled: null,
    });
    vi.clearAllMocks();
  });

  describe('setNotifications', () => {
    it('sets notifications and calculates unread count', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      
      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual(sampleNotifications);
      expect(state.unreadCount).toBe(2); // Two unread notifications
      expect(state.error).toBeNull();
    });
  });

  describe('addNotification', () => {
    it('adds new notification to the beginning of the list', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications([sampleNotifications[0]]);
      
      const newNotification: NotificationRecipient = {
        id: 4,
        seen: false,
        level: 'success',
        text: 'New notification',
        created_at: '2024-01-01T13:00:00Z',
        group: 'system',
      };
      
      store.addNotification(newNotification);
      
      const state = useNotificationStore.getState();
      expect(state.notifications[0]).toEqual(newNotification);
      expect(state.notifications).toHaveLength(2);
      expect(state.unreadCount).toBe(2);
    });

    it('updates existing notification if same id', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications([sampleNotifications[0]]);
      
      const updatedNotification: NotificationRecipient = {
        ...sampleNotifications[0],
        text: 'Updated notification',
        seen: true,
      };
      
      store.addNotification(updatedNotification);
      
      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].text).toBe('Updated notification');
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read and updates unread count', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      store.markAsRead(1);
      
      const state = useNotificationStore.getState();
      const notification = state.notifications.find(n => n.id === 1);
      expect(notification?.seen).toBe(true);
      expect(state.unreadCount).toBe(1); // One less unread
    });
  });

  describe('markGroupAsRead', () => {
    it('marks all notifications in group as read', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      store.markGroupAsRead('system');
      
      const state = useNotificationStore.getState();
      const systemNotifications = state.notifications.filter(n => n.group === 'system');
      systemNotifications.forEach(notification => {
        expect(notification.seen).toBe(true);
      });
      expect(state.unreadCount).toBe(1); // Only deployment group notification remains unread
    });
  });

  describe('clearNotification', () => {
    it('removes notification from list', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      store.clearNotification(1);
      
      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications.find(n => n.id === 1)).toBeUndefined();
      expect(state.unreadCount).toBe(1); // One less unread
    });
  });

  describe('clearGroup', () => {
    it('removes all notifications from group', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      store.clearGroup('system');
      
      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].group).toBe('deployment');
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('toggleDrawer', () => {
    it('toggles drawer open state', () => {
      const store = useNotificationStore.getState();
      
      expect(useNotificationStore.getState().isDrawerOpen).toBe(false);
      
      store.toggleDrawer();
      expect(useNotificationStore.getState().isDrawerOpen).toBe(true);
      
      store.toggleDrawer();
      expect(useNotificationStore.getState().isDrawerOpen).toBe(false);
    });
  });

  describe('expandGroup', () => {
    it('expands group when not expanded', () => {
      const store = useNotificationStore.getState();
      
      store.expandGroup('system');
      expect(useNotificationStore.getState().expandedGroup).toBe('system');
    });

    it('collapses group when already expanded', () => {
      const store = useNotificationStore.getState();
      
      store.expandGroup('system');
      expect(useNotificationStore.getState().expandedGroup).toBe('system');
      
      store.expandGroup('system');
      expect(useNotificationStore.getState().expandedGroup).toBeNull();
    });
  });

  describe('getGroupedNotifications', () => {
    it('groups notifications by group name', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      const grouped = store.getGroupedNotifications();
      
      expect(grouped).toHaveProperty('system');
      expect(grouped).toHaveProperty('deployment');
      expect(grouped.system.notifications).toHaveLength(2);
      expect(grouped.deployment.notifications).toHaveLength(1);
      expect(grouped.system.unreadCount).toBe(1);
      expect(grouped.deployment.unreadCount).toBe(1);
    });

    it('sorts notifications by created_at date descending', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      const grouped = store.getGroupedNotifications();
      
      const systemNotifications = grouped.system.notifications;
      expect(new Date(systemNotifications[0].created_at).getTime())
        .toBeGreaterThan(new Date(systemNotifications[1].created_at).getTime());
    });

    it('uses "General" group for notifications without group', () => {
      const store = useNotificationStore.getState();
      
      const notificationWithoutGroup: NotificationRecipient = {
        id: 4,
        seen: false,
        level: 'info',
        text: 'No group notification',
        created_at: '2024-01-01T13:00:00Z',
        group: '',
      };
      
      store.setNotifications([notificationWithoutGroup]);
      const grouped = store.getGroupedNotifications();
      
      expect(grouped).toHaveProperty('General');
      expect(grouped.General.notifications).toHaveLength(1);
    });
  });

  describe('getUnreadCount', () => {
    it('returns correct unread count', () => {
      const store = useNotificationStore.getState();
      
      store.setNotifications(sampleNotifications);
      expect(store.getUnreadCount()).toBe(2);
    });
  });
});