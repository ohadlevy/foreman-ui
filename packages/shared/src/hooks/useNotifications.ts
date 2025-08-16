import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { notificationAPI } from '../api/notifications';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from '../auth/useAuth';
import { useWindowFocus } from './useWindowFocus';
import { clearForemanSessionCookies } from '../auth/constants';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];
const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_REFETCH_INTERVAL = 10000; // Minimum 10 seconds between window focus refetches

/**
 * Utility function to check if an error is a 401 authentication error
 */
const is401Error = (error: unknown): boolean => {
  const axiosError = error as { response?: { status?: number } };
  return axiosError?.response?.status === 401;
};

export const useNotifications = () => {
  const { isAuthenticated } = useAuth();
  const isWindowFocused = useWindowFocus();
  const {
    setNotifications,
    setLoading,
    setError,
    setLastPolled,
    notifications,
    error: storeError,
    lastPolled
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
      } catch (error: unknown) {
        // Handle 401 errors gracefully - likely session/PAT auth conflict
        if (is401Error(error)) {
          console.warn('Notification authentication failed - clearing session cookies to prevent future conflicts');
          // Clear session cookies that might be interfering with PAT authentication
          clearForemanSessionCookies();
          // Set a user-friendly error message instead of throwing
          setError('Notifications temporarily unavailable');
          // Return empty notifications instead of throwing to prevent cascade failures
          setNotifications([]);
          return [];
        }
        
        // For other errors, handle normally
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
    refetchOnWindowFocus: (_query) => {
      // Throttle window focus refetches to prevent excessive requests
      if (!lastPolled) return true; // First time, allow refetch
      const timeSinceLastPoll = Date.now() - lastPolled;
      const shouldRefetch = timeSinceLastPoll >= MIN_REFETCH_INTERVAL;
      
      // Prevent excessive refetches by enforcing minimum interval between requests
      
      return shouldRefetch;
    },
    staleTime: 10000, // 10 seconds
    // Allow retries for notifications but with different logic than global default
    retry: (failureCount, error: unknown) => {
      // Don't retry 401 errors - they indicate auth conflict that won't resolve
      if (is401Error(error)) {
        return false;
      }
      // For other errors, try up to 2 times with exponential backoff
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    notifications,
    isLoading: notificationsQuery.isLoading,
    error: storeError || notificationsQuery.error,
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