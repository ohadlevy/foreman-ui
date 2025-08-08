import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { notificationAPI } from '../api/notifications';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from '../auth/useAuth';
import { useWindowFocus } from './useWindowFocus';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];
const POLLING_INTERVAL = 30000; // 30 seconds

export const useNotifications = () => {
  const { isAuthenticated } = useAuth();
  const isWindowFocused = useWindowFocus();
  const {
    setNotifications,
    setLoading,
    setError,
    setLastPolled,
    notifications
  } = useNotificationStore();

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await notificationAPI.getNotifications();
        const notifications = response.notifications || [];
        setNotifications(notifications);
        setLastPolled(Date.now());
        setError(null);
        return notifications;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: isAuthenticated,
    refetchInterval: isWindowFocused ? POLLING_INTERVAL : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds
  });

  return {
    notifications,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
  };
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { markAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: async (id: number) => {
      await notificationAPI.markAsRead(id);
      markAsRead(id);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
};

export const useClearNotification = () => {
  const queryClient = useQueryClient();
  const { clearNotification } = useNotificationStore();

  return useMutation({
    mutationFn: async (id: number) => {
      await notificationAPI.clearNotification(id);
      clearNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to clear notification:', error);
    },
  });
};

export const useMarkGroupAsRead = () => {
  const queryClient = useQueryClient();
  const { markGroupAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: async (group: string) => {
      await notificationAPI.markGroupAsRead(group);
      markGroupAsRead(group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to mark group as read:', error);
    },
  });
};

export const useClearGroup = () => {
  const queryClient = useQueryClient();
  const { clearGroup } = useNotificationStore();

  return useMutation({
    mutationFn: async (group: string) => {
      await notificationAPI.clearGroup(group);
      clearGroup(group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to clear group:', error);
    },
  });
};

export const useNotificationActions = () => {
  const markAsReadMutation = useMarkNotificationAsRead();
  const clearNotificationMutation = useClearNotification();
  const markGroupAsReadMutation = useMarkGroupAsRead();
  const clearGroupMutation = useClearGroup();

  const markAsRead = useCallback((id: number) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const clearNotification = useCallback((id: number) => {
    clearNotificationMutation.mutate(id);
  }, [clearNotificationMutation]);

  const markGroupAsRead = useCallback((group: string) => {
    markGroupAsReadMutation.mutate(group);
  }, [markGroupAsReadMutation]);

  const clearGroup = useCallback((group: string) => {
    clearGroupMutation.mutate(group);
  }, [clearGroupMutation]);

  return {
    markAsRead,
    clearNotification,
    markGroupAsRead,
    clearGroup,
    isLoading:
      markAsReadMutation.isPending ||
      clearNotificationMutation.isPending ||
      markGroupAsReadMutation.isPending ||
      clearGroupMutation.isPending,
  };
};