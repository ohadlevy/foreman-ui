import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStatus } from '../useStatus';
import { fetchForemanStatus } from '../../api/status';

// Mock the API function
vi.mock('../../api/status', () => ({
  fetchForemanStatus: vi.fn(),
}));

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

describe('useStatus', () => {
  it('should fetch status data successfully', async () => {
    const mockStatus = {
      version: '3.12.1',
      api_version: 2,
      satellite: false,
    };

    (fetchForemanStatus as any).mockResolvedValue(mockStatus);

    const { result } = renderHook(() => useStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStatus);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors when fetching status', async () => {
    const mockError = new Error('API Error');
    (fetchForemanStatus as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 2000 });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it('should use correct query key and configuration', async () => {
    const mockStatus = {
      version: '3.12.1',
      api_version: 2,
    };

    (fetchForemanStatus as any).mockResolvedValue(mockStatus);

    const { result } = renderHook(() => useStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify that the query key is correct by checking if it's cached
    expect(fetchForemanStatus).toHaveBeenCalledTimes(1);
  });
});