import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDrawer } from '../NotificationDrawer';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useNotifications, useNotificationActions } from '../../../hooks/useNotifications';

// Mock the dependencies
vi.mock('../../../stores/notificationStore');
vi.mock('../../../hooks/useNotifications');

const mockUseNotificationStore = vi.mocked(useNotificationStore);
const mockUseNotifications = vi.mocked(useNotifications);
const mockUseNotificationActions = vi.mocked(useNotificationActions);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('NotificationDrawer', () => {
  const mockSetDrawerOpen = vi.fn();
  const mockRefetch = vi.fn();
  const mockMarkGroupAsRead = vi.fn();
  const mockClearGroup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: false,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: null,
      isLoading: false,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    mockUseNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUseNotificationActions.mockReturnValue({
      markAsRead: vi.fn(),
      clearNotification: vi.fn(),
      markGroupAsRead: mockMarkGroupAsRead,
      clearGroup: mockClearGroup,
      isLoading: false,
    });
  });

  it('renders children when drawer is closed', () => {
    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders drawer when open', () => {
    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: true,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: null,
      isLoading: false,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    // Check for the PatternFly notification drawer specifically
    expect(screen.getByText('All read')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: true,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: null,
      isLoading: false,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    expect(screen.getByText('No notifications to display.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: true,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: null,
      isLoading: true,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: true,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: 'Failed to load notifications',
      isLoading: false,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    expect(screen.getByText('Error loading notifications')).toBeInTheDocument();
    expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
  });

  it('closes drawer when close button is clicked', () => {
    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: true,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: null,
      isLoading: false,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(mockSetDrawerOpen).toHaveBeenCalledWith(false);
  });

  it('calls refetch when refresh button is clicked', () => {
    mockUseNotificationStore.mockReturnValue({
      isDrawerOpen: true,
      setDrawerOpen: mockSetDrawerOpen,
      getGroupedNotifications: vi.fn().mockReturnValue({}),
      unreadCount: 0,
      error: null,
      isLoading: false,
      notifications: [],
      expandedGroup: null,
      lastPolled: null,
      toggleDrawer: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      expandGroup: vi.fn(),
      setNotifications: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationDrawer>
          <div>Test Content</div>
        </NotificationDrawer>
      </TestWrapper>
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalledOnce();
  });
});