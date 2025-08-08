import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useUser } from '../useUsers';
import { useAuth } from '../../auth/useAuth';
import { useApi } from '../useApi';

// Mock the dependencies
vi.mock('../../auth/useAuth');
vi.mock('../useApi');

const mockUseAuth = vi.mocked(useAuth);
const mockUseApi = vi.mocked(useApi);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestWrapper.displayName = 'TestWrapper';

  return TestWrapper;
};

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call hasPermission for permission checks', async () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);
    const mockUsersList = vi.fn().mockResolvedValue([]);

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      users: {
        list: mockUsersList,
      },
    } as any);

    const { rerender } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    // Initial render should call hasPermission
    expect(mockHasPermission).toHaveBeenCalledWith('view_users');
    expect(mockHasPermission).toHaveBeenCalledTimes(1);

    // Re-render will call hasPermission again (no memoization)
    rerender();

    // hasPermission should be called again on re-render
    expect(mockHasPermission).toHaveBeenCalledTimes(2);
  });

  it('should re-evaluate permission when hasPermission function changes', async () => {
    const mockHasPermission1 = vi.fn().mockReturnValue(true);
    const mockHasPermission2 = vi.fn().mockReturnValue(false);
    const mockUsersList = vi.fn().mockResolvedValue([]);

    mockUseApi.mockReturnValue({
      users: {
        list: mockUsersList,
      },
    } as any);

    // First render with first hasPermission function
    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission1,
    } as any);

    const { rerender } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission1).toHaveBeenCalledWith('view_users');
    expect(mockHasPermission1).toHaveBeenCalledTimes(1);

    // Change to different hasPermission function
    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission2,
    } as any);

    rerender();

    // New function should be called
    expect(mockHasPermission2).toHaveBeenCalledWith('view_users');
    expect(mockHasPermission2).toHaveBeenCalledTimes(1);
  });

  it('should disable query when user lacks view_users permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);
    const mockUsersList = vi.fn().mockResolvedValue([]);

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      users: {
        list: mockUsersList,
      },
    } as any);

    renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission).toHaveBeenCalledWith('view_users');
    // Query should be disabled, so API should not be called
    expect(mockUsersList).not.toHaveBeenCalled();
  });
});

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call hasPermission for individual user queries', () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);
    const mockUsersGet = vi.fn().mockResolvedValue({});

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      users: {
        get: mockUsersGet,
      },
    } as any);

    const { rerender } = renderHook(() => useUser(1), {
      wrapper: createWrapper(),
    });

    // Initial render should call hasPermission
    expect(mockHasPermission).toHaveBeenCalledWith('view_users');
    expect(mockHasPermission).toHaveBeenCalledTimes(1);

    // Re-render will call hasPermission again (no memoization)
    rerender();
    expect(mockHasPermission).toHaveBeenCalledTimes(2);
  });

  it('should disable query when user lacks permission or id is invalid', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);
    const mockUsersGet = vi.fn().mockResolvedValue({});

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      users: {
        get: mockUsersGet,
      },
    } as any);

    renderHook(() => useUser(1), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission).toHaveBeenCalledWith('view_users');
    // Query should be disabled due to lack of permission
    expect(mockUsersGet).not.toHaveBeenCalled();
  });
});