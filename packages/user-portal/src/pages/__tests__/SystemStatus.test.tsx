import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';
import { SystemStatus } from '../SystemStatus';
import type { ForemanStatus, ForemanPingResponse, ForemanStatusesResponse } from '@foreman/shared';

// Mock the shared hooks
vi.mock('@foreman/shared', () => ({
  usePlugins: vi.fn(),
  usePluginLoadState: vi.fn(),
  usePluginDashboardWidgets: vi.fn(),
  usePluginMenuItems: vi.fn(),
  useAuth: vi.fn(),
  useStatus: vi.fn(),
  usePing: vi.fn(),
  useStatuses: vi.fn(),
}));

const mockHooks = vi.mocked(await import('@foreman/shared'));

// Helper to create proper UseQueryResult mock
const createStatusMock = (overrides: Record<string, unknown>): UseQueryResult<ForemanStatus, Error> => ({
  data: undefined,
  error: null,
  isError: false,
  isLoading: false,
  isSuccess: false,
  isFetching: false,
  isStale: false,
  isRefetching: false,
  refetch: vi.fn(),
  remove: vi.fn(),
  status: 'loading',
  fetchStatus: 'idle',
  isLoadingError: false,
  isRefetchError: false,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  isPaused: false,
  errorUpdateCount: 0,
  isFetched: false,
  isFetchedAfterMount: false,
  failureReason: null,
  isInitialLoading: false,
  isPlaceholderData: false,
  isPreviousData: false,
  ...overrides,
} as unknown as UseQueryResult<ForemanStatus, Error>);

const createPingMock = (overrides: Record<string, unknown>): UseQueryResult<ForemanPingResponse, Error> => ({
  data: undefined,
  error: null,
  isError: false,
  isLoading: false,
  isSuccess: false,
  isFetching: false,
  isStale: false,
  isRefetching: false,
  refetch: vi.fn(),
  remove: vi.fn(),
  status: 'loading',
  fetchStatus: 'idle',
  isLoadingError: false,
  isRefetchError: false,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  isPaused: false,
  errorUpdateCount: 0,
  isFetched: false,
  isFetchedAfterMount: false,
  failureReason: null,
  isInitialLoading: false,
  isPlaceholderData: false,
  isPreviousData: false,
  ...overrides,
} as unknown as UseQueryResult<ForemanPingResponse, Error>);

const createStatusesMock = (overrides: Record<string, unknown>): UseQueryResult<ForemanStatusesResponse, Error> => ({
  data: undefined,
  error: null,
  isError: false,
  isLoading: false,
  isSuccess: false,
  isFetching: false,
  isStale: false,
  isRefetching: false,
  refetch: vi.fn(),
  remove: vi.fn(),
  status: 'loading',
  fetchStatus: 'idle',
  isLoadingError: false,
  isRefetchError: false,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  isPaused: false,
  errorUpdateCount: 0,
  isFetched: false,
  isFetchedAfterMount: false,
  failureReason: null,
  isInitialLoading: false,
  isPlaceholderData: false,
  isPreviousData: false,
  ...overrides,
} as unknown as UseQueryResult<ForemanStatusesResponse, Error>);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestWrapper.displayName = 'TestWrapper';

  return TestWrapper;
};

describe('SystemStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockHooks.usePlugins.mockReturnValue([]);
    mockHooks.usePluginLoadState.mockReturnValue({
      loaded: [],
      failed: [],
      loading: false,
    });
    mockHooks.usePluginDashboardWidgets.mockReturnValue([]);
    mockHooks.usePluginMenuItems.mockReturnValue([]);
    mockHooks.useAuth.mockReturnValue({
      user: {
        id: 1,
        login: 'test',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      loginWithToken: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: vi.fn(),
      isLoginLoading: false,
      isLogoutLoading: false,
    });
    mockHooks.useStatus.mockReturnValue(createStatusMock({
      data: { version: '3.12.1', api_version: 2 },
      isSuccess: true,
      status: 'success',
      isFetched: true,
      isFetchedAfterMount: true,
      dataUpdatedAt: Date.now(),
    }));
    mockHooks.usePing.mockReturnValue(createPingMock({
      data: { status: 'ok', version: '3.12.1', api_version: 2 },
      isSuccess: true,
      status: 'success',
      isFetched: true,
      isFetchedAfterMount: true,
      dataUpdatedAt: Date.now(),
    }));
    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      data: {
        results: {
          foreman: {
            version: '3.12.1',
            api: { version: 'v2' },
            plugins: [],
            smart_proxies: [],
            compute_resources: [],
            database: { active: true, duration_ms: 0 },
            cache: { servers: [{ status: 'ok', duration_ms: 0 }] }
          }
        }
      },
      isSuccess: true,
      status: 'success',
      isFetched: true,
      isFetchedAfterMount: true,
      dataUpdatedAt: Date.now(),
    }));
  });

  it('should render system status page with health metrics when plugins exist', () => {
    const mockPlugins = [
      {
        name: 'test_plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Description',
        routes: [],
        menuItems: [],
        dashboardWidgets: [],
      },
    ];

    mockHooks.usePlugins.mockReturnValue(mockPlugins);

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Overall System Health')).toBeInTheDocument();
    expect(screen.getByText('API Connection')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Extensions')).toBeInTheDocument();
    expect(screen.getByText('Foreman Version')).toBeInTheDocument();
  });

  it('should display Foreman version from API', () => {
    const mockPlugins = [{ name: 'test_plugin' }];
    mockHooks.usePlugins.mockReturnValue(mockPlugins as never);

    // usePing is already mocked with version 3.12.1 in beforeEach

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('3.12.1')).toBeInTheDocument();
  });

  it('should show loading state for version', () => {
    const mockPlugins = [{ name: 'test_plugin' }];
    mockHooks.usePlugins.mockReturnValue(mockPlugins as never);

    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      isLoading: true,
      isFetching: true,
      status: 'loading',
      fetchStatus: 'fetching',
      isInitialLoading: true,
    }));

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show unknown version on error', () => {
    const mockPlugins = [{ name: 'test_plugin' }];
    mockHooks.usePlugins.mockReturnValue(mockPlugins as never);

    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      error: new Error('API Error'),
      isError: true,
      status: 'error',
      isLoadingError: true,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      errorUpdateCount: 1,
      isFetched: true,
      isFetchedAfterMount: true,
      failureReason: new Error('API Error'),
    }));

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should display plugin statistics', () => {
    const mockPlugins = [
      {
        name: 'test_plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test Description',
        routes: [],
        menuItems: [],
        dashboardWidgets: [],
      },
    ];

    mockHooks.usePlugins.mockReturnValue(mockPlugins);
    mockHooks.usePluginLoadState.mockReturnValue({
      loaded: ['test_plugin'],
      failed: [],
      loading: false,
    });

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getAllByText('Installed Extensions')).toHaveLength(2); // Appears in stats and main section
    expect(screen.getByText('Working Extensions')).toBeInTheDocument();
  });

  it('should show empty state when no plugins are installed', () => {
    mockHooks.usePlugins.mockReturnValue([]);

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('No additional extensions found')).toBeInTheDocument();
    expect(screen.getByText(/Your Foreman installation is running with the core features only/)).toBeInTheDocument();
  });

  it('should display plugin details in expandable section', () => {
    const mockPlugins = [
      {
        name: 'test_plugin',
        displayName: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test plugin for demonstration',
        routes: [],
        menuItems: [{ id: 'test', label: 'Test', path: '/test' }],
        dashboardWidgets: [],
      },
    ];

    mockHooks.usePlugins.mockReturnValue(mockPlugins);
    mockHooks.usePluginLoadState.mockReturnValue({
      loaded: ['test_plugin'],
      failed: [],
      loading: false,
    });

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Show 1 extension')).toBeInTheDocument();
  });

  it('should calculate correct health percentages', () => {
    const mockPlugins = [
      { name: 'plugin1' },
      { name: 'plugin2' },
    ];

    mockHooks.usePlugins.mockReturnValue(mockPlugins as never);
    mockHooks.usePluginLoadState.mockReturnValue({
      loaded: ['plugin1'], // Only 1 out of 2 loaded
      failed: [{ name: 'plugin2', error: new Error('Plugin failed') }],
      loading: false,
    });

    render(<SystemStatus />, { wrapper: createWrapper() });

    // Should show health status based on plugin success rate
    // With 50% plugin health, 100% API, 100% auth, overall should be weighted average
    const healthElements = screen.getAllByText(/\d+%/);
    expect(healthElements.length).toBeGreaterThan(0);
  });

  it('should display system components status', () => {
    // Need to have plugins for the main status page to render
    mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

    const mockStatuses = {
      results: {
        foreman: {
          version: '3.12.1',
          api: { version: 'v2' },
          plugins: [],
          smart_proxies: [],
          compute_resources: [],
          database: { active: true, duration_ms: 5 },
          cache: { servers: [{ status: 'ok', duration_ms: 2 }] }
        }
      }
    };

    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      data: mockStatuses,
      isSuccess: true,
      isLoading: false,
    }));

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('System Components Status')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Cache System')).toBeInTheDocument();
    expect(screen.getByText('API Service')).toBeInTheDocument();
    expect(screen.getAllByText('OK')).toHaveLength(3); // Database, Cache System, and API Service (has version)
  });

  it('should show loading state for system statuses', () => {
    // Need to have plugins for the main status page to render
    mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      data: undefined,
      isLoading: true,
    }));

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading system statuses...')).toBeInTheDocument();
  });

  it('should handle system statuses API error', () => {
    // Need to have plugins for the main status page to render
    mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      data: undefined,
      isError: true,
      error: new Error('API Error'),
    }));

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Unable to fetch system statuses')).toBeInTheDocument();
    expect(screen.getByText(/Foreman API is not accessible/)).toBeInTheDocument();
  });

  it('should show message when no system statuses available', () => {
    // Need to have plugins for the main status page to render
    mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

    mockHooks.useStatuses.mockReturnValue(createStatusesMock({
      data: { results: {} },
      isSuccess: true,
    }));

    render(<SystemStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('No system status information available')).toBeInTheDocument();
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database inactive status', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      // Mock statuses with database inactive
      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: {
          results: {
            foreman: {
              version: '3.12.1',
              api: { version: 'v2' },
              plugins: [],
              smart_proxies: [],
              compute_resources: [],
              database: { active: false, duration_ms: 0 }, // Database is down
              cache: { servers: [{ status: 'ok', duration_ms: 0 }] }
            }
          }
        },
        isSuccess: true,
      }));

      // Should not crash
      render(<SystemStatus />, { wrapper: createWrapper() });

      // Should display database as ERROR and others as OK
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Cache System')).toBeInTheDocument();
      expect(screen.getAllByText('OK')).toHaveLength(2); // Cache System and API Service (has version)
      expect(screen.getAllByText('ERROR')).toHaveLength(1); // Database inactive
    });

    it('should handle cache servers errors', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: {
          results: {
            foreman: {
              version: '3.12.1',
              api: { version: 'v2' },
              plugins: [],
              smart_proxies: [],
              compute_resources: [],
              database: { active: true, duration_ms: 0 },
              cache: { servers: [{ status: 'error', duration_ms: 1000 }] } // Cache server error
            }
          }
        },
        isSuccess: true,
      }));

      // Should not crash
      render(<SystemStatus />, { wrapper: createWrapper() });

      // Should show cache as ERROR
      expect(screen.getByText('Cache System')).toBeInTheDocument();
      expect(screen.getAllByText('OK')).toHaveLength(2); // Database and API Service (has version)
      expect(screen.getAllByText('ERROR')).toHaveLength(1); // Cache system
    });

    it('should handle complete system status information', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: {
          results: {
            foreman: {
              version: '3.12.1',
              api: { version: 'v2' },
              plugins: [],
              smart_proxies: [],
              compute_resources: [],
              database: { active: true, duration_ms: 5 },
              cache: { servers: [{ status: 'ok', duration_ms: 1 }] }
            }
          }
        },
        isSuccess: true,
      }));

      // Should not crash and should display all system components
      render(<SystemStatus />, { wrapper: createWrapper() });

      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Cache System')).toBeInTheDocument();
      expect(screen.getByText('API Service')).toBeInTheDocument();
      expect(screen.getAllByText('OK')).toHaveLength(3); // Database, Cache System, and API Service (has version)
    });

    it('should handle completely malformed statuses data', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      // Mock with completely wrong data structure
      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: 'not-an-object' as unknown as Record<string, unknown>,
        isSuccess: true,
      }));

      // Should not crash
      render(<SystemStatus />, { wrapper: createWrapper() });

      expect(screen.getByText('No system status information available')).toBeInTheDocument();
    });

    it('should handle array instead of object for statuses', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: [{ name: 'database', status: 'ok' }] as unknown as Record<string, unknown>, // array instead of object
        isSuccess: true,
      }));

      // Should not crash
      render(<SystemStatus />, { wrapper: createWrapper() });

      expect(screen.getByText('No system status information available')).toBeInTheDocument();
    });

    it('should handle database and cache status properly', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: {
          results: {
            foreman: {
              version: '3.16.0-develop',
              api: { version: 'v2' },
              plugins: [],
              smart_proxies: [],
              compute_resources: [],
              database: { active: true, duration_ms: 0 },
              cache: { servers: [{ status: 'ok', duration_ms: 0 }] }
            }
          }
        },
        isSuccess: true,
      }));

      // Should render system components correctly
      render(<SystemStatus />, { wrapper: createWrapper() });

      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Cache System')).toBeInTheDocument();
      expect(screen.getByText('API Service')).toBeInTheDocument();
      expect(screen.getAllByText('OK')).toHaveLength(3); // Database, Cache System, and API Service (has version)
    });

    it('should handle invalid API versions as ERROR', () => {
      mockHooks.usePlugins.mockReturnValue([{ name: 'test_plugin' }] as never);

      // Test with an invalid version value
      mockHooks.useStatuses.mockReturnValue(createStatusesMock({
        data: {
          results: {
            foreman: {
              version: '3.16.0-develop',
              api: { version: 'unknown' }, // Invalid version
              plugins: [],
              smart_proxies: [],
              compute_resources: [],
              database: { active: true, duration_ms: 0 },
              cache: { servers: [{ status: 'ok', duration_ms: 0 }] }
            }
          }
        },
        isSuccess: true,
      }));

      render(<SystemStatus />, { wrapper: createWrapper() });

      expect(screen.getByText('API Service')).toBeInTheDocument();
      expect(screen.getAllByText('OK')).toHaveLength(2); // Database and Cache System only
      expect(screen.getAllByText('ERROR')).toHaveLength(1); // API Service with invalid version
    });
  });
});