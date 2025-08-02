import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from '../NotificationBell';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useNotifications } from '../../../hooks/useNotifications';

// Mock the dependencies
vi.mock('../../../stores/notificationStore');
vi.mock('../../../hooks/useNotifications');

const mockUseNotificationStore = vi.mocked(useNotificationStore);
const mockUseNotifications = vi.mocked(useNotifications);

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

describe('NotificationBell', () => {
  const mockToggleDrawer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseNotificationStore.mockReturnValue({
      unreadCount: 0,
      toggleDrawer: mockToggleDrawer,
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      isLoading: false,
      error: null,
      lastPolled: null,
      setNotifications: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      setDrawerOpen: vi.fn(),
      expandGroup: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getGroupedNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    mockUseNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders bell icon', () => {
    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>
    );
    
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    expect(bellButton).toBeInTheDocument();
  });

  it('shows no badge when unread count is 0', () => {
    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>
    );
    
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('shows badge with unread count when there are unread notifications', () => {
    mockUseNotificationStore.mockReturnValue({
      unreadCount: 5,
      toggleDrawer: mockToggleDrawer,
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      isLoading: false,
      error: null,
      lastPolled: null,
      setNotifications: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      setDrawerOpen: vi.fn(),
      expandGroup: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getGroupedNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>
    );
    
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('shows "99+" for counts over 99', () => {
    mockUseNotificationStore.mockReturnValue({
      unreadCount: 150,
      toggleDrawer: mockToggleDrawer,
      notifications: [],
      isDrawerOpen: false,
      expandedGroup: null,
      isLoading: false,
      error: null,
      lastPolled: null,
      setNotifications: vi.fn(),
      addNotification: vi.fn(),
      markAsRead: vi.fn(),
      markGroupAsRead: vi.fn(),
      clearNotification: vi.fn(),
      clearGroup: vi.fn(),
      setDrawerOpen: vi.fn(),
      expandGroup: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastPolled: vi.fn(),
      getGroupedNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
    });

    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>
    );
    
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  it('calls toggleDrawer when clicked', () => {
    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>
    );
    
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    expect(mockToggleDrawer).toHaveBeenCalledOnce();
  });

  it('shows tooltip on hover', async () => {
    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>
    );
    
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.mouseEnter(bellButton);
    
    // PatternFly tooltips are rendered asynchronously
    const tooltip = await screen.findByText('Notifications');
    expect(tooltip).toBeInTheDocument();
  });
});