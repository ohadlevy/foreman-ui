import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerateRegistrationCommand, useRegistrationCommand } from '../useRegistration';
import { useApi } from '../useApi';
import { useAuth } from '../../auth/useAuth';

// Mock dependencies
vi.mock('../useApi');
vi.mock('../../auth/useAuth');

const mockUseApi = vi.mocked(useApi);
const mockUseAuth = vi.mocked(useAuth);

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('useRegistration hooks', () => {
  const mockRegistrationAPI = {
    generateCommand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseApi.mockReturnValue({
      registration: mockRegistrationAPI,
    } as any);

    mockUseAuth.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
    } as any);
  });

  describe('useGenerateRegistrationCommand', () => {
    it('should successfully generate registration script', async () => {
      const mockScript = `#!/bin/bash
# Foreman registration script
curl -X POST "https://foreman.example.com/api/v2/register" \\
  -H "Authorization: Bearer embedded-token" \\
  -d '{"organization_id":1}'`;

      const mockCommand = {
        script: mockScript,
        parameters: { organization_id: 1 },
      };

      mockRegistrationAPI.generateCommand.mockResolvedValue(mockCommand);

      const { result } = renderHook(() => useGenerateRegistrationCommand(), {
        wrapper: createWrapper(),
      });

      const params = { organization_id: 1, insecure: true };

      result.current.mutate(params);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRegistrationAPI.generateCommand).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockCommand);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      mockRegistrationAPI.generateCommand.mockRejectedValue(mockError);

      const { result } = renderHook(() => useGenerateRegistrationCommand(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ organization_id: 1 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useRegistrationCommand', () => {
    it('should fetch registration script when enabled and has permission', async () => {
      const mockCommand = {
        script: '#!/bin/bash\ncurl -X POST ...',
        parameters: { organization_id: 1 },
      };

      mockRegistrationAPI.generateCommand.mockResolvedValue(mockCommand);

      const params = { organization_id: 1, insecure: false };

      const { result } = renderHook(
        () => useRegistrationCommand(params, true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRegistrationAPI.generateCommand).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockCommand);
    });

    it('should not fetch when user lacks permission', async () => {
      mockUseAuth.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
      } as any);

      const params = { organization_id: 1 };

      const { result } = renderHook(
        () => useRegistrationCommand(params, true),
        { wrapper: createWrapper() }
      );

      // Should not call the API
      expect(mockRegistrationAPI.generateCommand).not.toHaveBeenCalled();
      expect(result.current.isFetching).toBe(false);
    });

    it('should not fetch when disabled', async () => {
      const params = { organization_id: 1 };

      const { result } = renderHook(
        () => useRegistrationCommand(params, false),
        { wrapper: createWrapper() }
      );

      expect(mockRegistrationAPI.generateCommand).not.toHaveBeenCalled();
      expect(result.current.isFetching).toBe(false);
    });
  });
});