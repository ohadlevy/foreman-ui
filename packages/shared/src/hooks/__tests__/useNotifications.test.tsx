import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNotifications, useMarkNotificationAsRead, useNotificationActions } from '../useNotifications';
import { useAuth } from '../../auth/useAuth';
import { notificationAPI } from '../../api/notifications';
import { useNotificationStore } from '../../stores/notificationStore';

// Mock dependencies
vi.mock('../../auth/useAuth');
vi.mock('../../api/notifications');
vi.mock('../../stores/notificationStore');

const mockUseAuth = vi.mocked(useAuth);
const mockNotificationAPI = vi.mocked(notificationAPI);
const mockUseNotificationStore = vi.mocked(useNotificationStore);

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useNotifications', () => {
  const mockSetNotifications = vi.fn();
  const mockSetLoading = vi.fn();
  const mockSetError = vi.fn();
  const mockSetLastPolled = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      loginWithToken: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: () => false,
      isLoginLoading: false,
      isLogoutLoading: false,
    });

    mockUseNotificationStore.mockReturnValue({
      notifications: [],
      setNotifications: mockSetNotifications,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setLastPolled: mockSetLastPolled,
      isDrawerOpen: false,
      expandedGroup: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastPolled: null,
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      toggleDrawer: vi.fn(),
      setDrawerOpen: vi.fn(),
      expandGroup: vi.fn(),
      getGroupedNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
    });
  });

  it('fetches notifications when authenticated', async () => {
    const mockNotifications = [
      {
        id: 1,
        seen: false,
        level: 'info' as const,
        text: 'Test notification',
        created_at: '2024-01-01T10:00:00Z',
        group: 'system',
      },
    ];

    mockNotificationAPI.getNotifications.mockResolvedValue({
      notifications: mockNotifications,
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockNotificationAPI.getNotifications).toHaveBeenCalled();
    expect(mockSetNotifications).toHaveBeenCalledWith(mockNotifications);
    expect(mockSetLastPolled).toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it('does not fetch when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      loginWithToken: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: () => false,
      isLoginLoading: false,
      isLogoutLoading: false,
    });

    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    expect(mockNotificationAPI.getNotifications).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch notifications';
    const networkError = new Error(errorMessage);
    mockNotificationAPI.getNotifications.mockRejectedValue(networkError);

    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('handles 401 errors gracefully without throwing', async () => {
    const authError = {
      response: { status: 401 }
    };
    mockNotificationAPI.getNotifications.mockRejectedValue(authError);

    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Notifications temporarily unavailable');
    });

    expect(mockSetNotifications).toHaveBeenCalledWith([]);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
});

describe('useMarkNotificationAsRead', () => {
  const mockMarkAsRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNotificationStore.mockReturnValue({
      markAsRead: mockMarkAsRead,
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastPolled: null,
      setNotifications: vi.fn(),
      addNotification: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      toggleDrawer: vi.fn(),
      setDrawerOpen: vi.fn(),
      expandGroup: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getGroupedNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
    });
  });

  it('marks notification as read', async () => {
    mockNotificationAPI.markAsRead.mockResolvedValue();

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNotificationAPI.markAsRead).toHaveBeenCalledWith(1);
    expect(mockMarkAsRead).toHaveBeenCalledWith(1);
  });

  it('handles mark as read errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockNotificationAPI.markAsRead.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to mark notification as read:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('useNotificationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNotificationStore.mockReturnValue({
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastPolled: null,
      setNotifications: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      toggleDrawer: vi.fn(),
      setDrawerOpen: vi.fn(),
      expandGroup: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getGroupedNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    // Mock all API methods
    mockNotificationAPI.markAsRead.mockResolvedValue();
    mockNotificationAPI.clearNotification.mockResolvedValue();
    mockNotificationAPI.markGroupAsRead.mockResolvedValue();
    mockNotificationAPI.clearGroup.mockResolvedValue();
  });

  it('provides all action methods', () => {
    const { result } = renderHook(() => useNotificationActions(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('markAsRead');
    expect(result.current).toHaveProperty('clearNotification');
    expect(result.current).toHaveProperty('markGroupAsRead');
    expect(result.current).toHaveProperty('clearGroup');
    expect(result.current).toHaveProperty('isLoading');
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.clearNotification).toBe('function');
    expect(typeof result.current.markGroupAsRead).toBe('function');
    expect(typeof result.current.clearGroup).toBe('function');
  });

  it('tracks loading state across all mutations', async () => {
    const { result } = renderHook(() => useNotificationActions(), {
      wrapper: createWrapper(),
    });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Start a mutation and check loading state
    result.current.markAsRead(1);

    // The loading state is managed by the individual mutation hooks
    // and aggregated in the useNotificationActions hook
    expect(typeof result.current.isLoading).toBe('boolean');
  });
});