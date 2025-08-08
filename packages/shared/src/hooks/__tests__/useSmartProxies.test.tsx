import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSmartProxies } from '../useSmartProxies';
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

describe('useSmartProxies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call hasPermission for permission checks', async () => {
    const mockHasPermission = vi.fn().mockReturnValue(true);
    const mockSmartProxiesList = vi.fn().mockResolvedValue({
      results: [
        { id: 1, name: 'Test Proxy', url: 'https://proxy.example.com', features: [] }
      ]
    });

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      smartproxies: {
        list: mockSmartProxiesList,
      },
    } as any);

    renderHook(() => useSmartProxies(), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission).toHaveBeenCalledWith('view_smart_proxies');
  });

  it('should disable query when user lacks permission', () => {
    const mockHasPermission = vi.fn().mockReturnValue(false);
    const mockSmartProxiesList = vi.fn().mockResolvedValue([]);

    mockUseAuth.mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    mockUseApi.mockReturnValue({
      smartproxies: {
        list: mockSmartProxiesList,
      },
    } as any);

    renderHook(() => useSmartProxies(), {
      wrapper: createWrapper(),
    });

    expect(mockHasPermission).toHaveBeenCalledWith('view_smart_proxies');
    // Query should be disabled, so API should not be called
    expect(mockSmartProxiesList).not.toHaveBeenCalled();
  });
});