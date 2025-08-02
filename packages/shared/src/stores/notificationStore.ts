import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationRecipient {
  id: number;
  seen: boolean;
  level: 'info' | 'warning' | 'error' | 'success';
  text: string;
  created_at: string;
  group: string;
  actions?: Record<string, unknown>;
}

export interface NotificationGroupData {
  name: string;
  notifications: NotificationRecipient[];
  unreadCount: number;
}

interface NotificationState {
  notifications: NotificationRecipient[];
  isDrawerOpen: boolean;
  expandedGroup: string | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastPolled: number | null;
}

interface NotificationActions {
  setNotifications: (notifications: NotificationRecipient[]) => void;
  addNotification: (notification: NotificationRecipient) => void;
  markAsRead: (id: number) => void;
  markGroupAsRead: (group: string) => void;
  clearNotification: (id: number) => void;
  clearGroup: (group: string) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  expandGroup: (group: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastPolled: (timestamp: number) => void;
  getGroupedNotifications: () => Record<string, NotificationGroupData>;
  getUnreadCount: () => number;
}

export type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastPolled: null,

      // Actions
      setNotifications: (notifications: NotificationRecipient[]) => {
        const unreadCount = notifications.filter(n => !n.seen).length;
        set({ notifications, unreadCount, error: null });
      },

      addNotification: (notification: NotificationRecipient) => {
        const { notifications } = get();
        const existingIndex = notifications.findIndex(n => n.id === notification.id);
        
        if (existingIndex >= 0) {
          // Update existing notification
          const updatedNotifications = [...notifications];
          updatedNotifications[existingIndex] = notification;
          const unreadCount = updatedNotifications.filter(n => !n.seen).length;
          set({ notifications: updatedNotifications, unreadCount });
        } else {
          // Add new notification
          const updatedNotifications = [notification, ...notifications];
          const unreadCount = updatedNotifications.filter(n => !n.seen).length;
          set({ notifications: updatedNotifications, unreadCount });
        }
      },

      markAsRead: (id: number) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(n =>
          n.id === id ? { ...n, seen: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.seen).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      markGroupAsRead: (group: string) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(n =>
          n.group === group ? { ...n, seen: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.seen).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      clearNotification: (id: number) => {
        const { notifications } = get();
        const updatedNotifications = notifications.filter(n => n.id !== id);
        const unreadCount = updatedNotifications.filter(n => !n.seen).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      clearGroup: (group: string) => {
        const { notifications } = get();
        const updatedNotifications = notifications.filter(n => n.group !== group);
        const unreadCount = updatedNotifications.filter(n => !n.seen).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      toggleDrawer: () => {
        const { isDrawerOpen } = get();
        set({ isDrawerOpen: !isDrawerOpen });
      },

      setDrawerOpen: (isOpen: boolean) => {
        set({ isDrawerOpen: isOpen });
      },

      expandGroup: (group: string) => {
        const { expandedGroup } = get();
        const newExpandedGroup = expandedGroup === group ? null : group;
        set({ expandedGroup: newExpandedGroup });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      setLastPolled: (lastPolled: number) => {
        set({ lastPolled });
      },

      getGroupedNotifications: (): Record<string, NotificationGroupData> => {
        const { notifications } = get();
        const grouped: Record<string, NotificationGroupData> = {};

        notifications.forEach(notification => {
          const groupName = notification.group || 'General';
          
          if (!grouped[groupName]) {
            grouped[groupName] = {
              name: groupName,
              notifications: [],
              unreadCount: 0,
            };
          }

          grouped[groupName].notifications.push(notification);
          if (!notification.seen) {
            grouped[groupName].unreadCount++;
          }
        });

        // Sort notifications within each group by created_at (newest first)
        Object.values(grouped).forEach(group => {
          group.notifications.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

        return grouped;
      },

      getUnreadCount: (): number => {
        const { notifications } = get();
        return notifications.filter(n => !n.seen).length;
      },
    }),
    {
      name: 'foreman-notifications',
      partialize: (state) => ({
        isDrawerOpen: state.isDrawerOpen,
        expandedGroup: state.expandedGroup,
        // Don't persist notifications - they should be fetched fresh
      }),
    }
  )
);