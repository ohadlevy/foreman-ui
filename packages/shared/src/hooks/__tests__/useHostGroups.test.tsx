import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHostGroups } from '../useHostGroups';
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

describe('useHostGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call hasPermission for permission checks', async () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);
    const mockHostGroupsList = vi.fn().mockResolvedValue({
      results: [
        { id: 1, name: 'Test Group', title: 'Test Group' }
      ]
    });

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      hostgroups: {
        list: mockHostGroupsList,
      },
    } as any);

    renderHook(() => useHostGroups(), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission).toHaveBeenCalledWith('view_hostgroups');
  });

  it('should disable query when user lacks permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);
    const mockHostGroupsList = vi.fn().mockResolvedValue([]);

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      hostgroups: {
        list: mockHostGroupsList,
      },
    } as any);

    renderHook(() => useHostGroups(), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission).toHaveBeenCalledWith('view_hostgroups');
    // Query should be disabled, so API should not be called
    expect(mockHostGroupsList).not.toHaveBeenCalled();
  });
});