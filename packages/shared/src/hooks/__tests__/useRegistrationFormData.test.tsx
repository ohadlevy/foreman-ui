import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegistrationFormData } from '../useRegistrationFormData';
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

  const QueryClientWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  QueryClientWrapper.displayName = 'QueryClientWrapper';
  
  return QueryClientWrapper;
};

describe('useRegistrationFormData', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    } as any);

    mockUseApi.mockReturnValue({
      registrationForm: {
        getFormData: vi.fn().mockResolvedValue({
          hostGroups: [
            { id: 1, name: 'Test Group', title: 'Test Group Title' },
          ],
          smartProxies: [
            { id: 1, name: 'Test Proxy', url: 'https://proxy.example.com' },
          ],
        }),
      },
    } as any);
  });

  it('should fetch registration form data when enabled', async () => {
    const { result } = renderHook(() => useRegistrationFormData(), {
      wrapper: createWrapper(),
    });

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for the query to resolve
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      hostGroups: [
        { id: 1, name: 'Test Group', title: 'Test Group Title' },
      ],
      smartProxies: [
        { id: 1, name: 'Test Proxy', url: 'https://proxy.example.com' },
      ],
    });
  });

  it('should not fetch data when user lacks permission', () => {
    const mockGetFormData = vi.fn();

    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(false),
    } as any);

    mockUseApi.mockReturnValue({
      registrationForm: {
        getFormData: mockGetFormData,
      },
    } as any);

    renderHook(() => useRegistrationFormData(), {
      wrapper: createWrapper(),
    });

    // Since the query is disabled, the function should never be called
    expect(mockGetFormData).not.toHaveBeenCalled();
  });
});