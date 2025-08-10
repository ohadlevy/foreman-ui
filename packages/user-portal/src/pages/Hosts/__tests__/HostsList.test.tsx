import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HostsList } from '../HostsList';

// Mock the shared hooks and modules
vi.mock('@foreman/shared', () => ({
  useMyHosts: vi.fn(),
  usePermissions: vi.fn(),
  useActivityStore: vi.fn(),
  formatDateTime: vi.fn((date) => `formatted-${date}`),
  formatRelativeTime: vi.fn((date) => `${date} ago`),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  RecentHosts: () => <div>Recent Hosts</div>,
  RecentSearches: () => <div>Recent Searches</div>,
  pluginRegistry: {
    getPluginsWithExtensions: vi.fn(() => []),
    subscribe: vi.fn(() => () => {}),
  },
  EXTENSION_POINTS: {
    HOST_TABLE_COLUMNS: 'host-table-columns',
    HOST_BULK_ACTIONS: 'host-bulk-actions',
  },
  useBulkSelection: vi.fn(() => ({
    selectedIds: [],
    selectedObjects: [],
    selectedCount: 0,
    isSelected: vi.fn(() => false),
    isAllSelected: false,
    isPartiallySelected: false,
    toggleItem: vi.fn(),
    toggleAll: vi.fn(),
    selectItems: vi.fn(),
    deselectItems: vi.fn(),
    clearSelection: vi.fn(),
    selectAll: vi.fn(),
  })),
  BulkActionToolbar: () => <div data-testid="bulk-action-toolbar">Bulk Actions</div>,
  BulkActionModal: () => <div data-testid="bulk-action-modal">Bulk Action Modal</div>,
  useBulkDeleteHosts: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useBulkUpdateHostGroup: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useHostGroups: vi.fn(() => ({ data: { results: [] } })),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Import the mocked module to access mock functions
const mockedShared = vi.mocked(await import('@foreman/shared'));

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
  
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('HostsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    // Default mock implementations
    mockedShared.useMyHosts.mockReturnValue({
      data: { results: [], total: 0, subtotal: 0, page: 1, per_page: 20 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isStale: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockedShared.useMyHosts>);

    mockedShared.usePermissions.mockReturnValue({
      hasUserData: true,
      canCreateHosts: () => true,
      canViewHosts: () => true,
      canEditHosts: () => true,
      canDeleteHosts: () => true,
      canBuildHosts: () => true,
      canPowerHosts: () => true,
      can: () => true,
    } as unknown as ReturnType<typeof mockedShared.usePermissions>);

    mockedShared.useActivityStore.mockReturnValue({
      addActivity: vi.fn(),
    });
  });

  it('should render the hosts list page', () => {
    render(<HostsList />, { wrapper: createWrapper() });
    
    expect(screen.getByText('My Hosts')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search hosts...')).toBeInTheDocument();
    expect(screen.getByText('Manage columns')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockedShared.useMyHosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      status: 'loading',
      isRefetching: false,
      isFetching: true,
      isPaused: false,
      isStale: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockedShared.useMyHosts>);

    render(<HostsList />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockedShared.useMyHosts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load hosts'),
      isError: true,
      isSuccess: false,
      status: 'error',
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isStale: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockedShared.useMyHosts>);

    render(<HostsList />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Error loading hosts')).toBeInTheDocument();
    expect(screen.getByText('Failed to load hosts')).toBeInTheDocument();
  });

  it('should show empty state when no hosts', () => {
    render(<HostsList />, { wrapper: createWrapper() });
    
    expect(screen.getByText('No hosts found')).toBeInTheDocument();
    expect(screen.getByText('You don\'t have any hosts yet. Create your first host to get started.')).toBeInTheDocument();
  });

  it('should render hosts table when hosts exist', () => {
    const mockHosts = [
      {
        id: 1,
        name: 'test-host-1',
        enabled: true,
        build: false,
        managed: true,
        capabilities: [],
        operatingsystem_name: 'Ubuntu 20.04',
        ip: '192.168.1.10',
        last_report: '2023-01-01T10:00:00Z',
        created_at: '2023-01-01T08:00:00Z',
        updated_at: '2023-01-01T10:00:00Z',
      },
    ];

    mockedShared.useMyHosts.mockReturnValue({
      data: { results: mockHosts, total: 1, subtotal: 1, page: 1, per_page: 20 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isStale: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockedShared.useMyHosts>);

    render(<HostsList />, { wrapper: createWrapper() });
    
    expect(screen.getByText('test-host-1')).toBeInTheDocument();
    expect(screen.getByText('Ubuntu 20.04')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
  });

  it('should open column management modal', async () => {
    render(<HostsList />, { wrapper: createWrapper() });
    
    const manageColumnsButton = screen.getByText('Manage columns');
    fireEvent.click(manageColumnsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Core columns')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', () => {
    const addActivity = vi.fn();
    mockedShared.useActivityStore.mockReturnValue({ addActivity });

    mockedShared.useMyHosts.mockReturnValue({
      data: { results: [], total: 0, subtotal: 0, page: 1, per_page: 20 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isStale: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockedShared.useMyHosts>);

    render(<HostsList />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText('Search hosts...');
    fireEvent.change(searchInput, { target: { value: 'test-search' } });
    
    expect(searchInput).toHaveValue('test-search');
  });

  it('should handle host click navigation', () => {
    const mockHosts = [
      {
        id: 1,
        name: 'test-host-1',
        enabled: true,
        build: false,
        managed: true,
        capabilities: [],
        created_at: '2023-01-01T08:00:00Z',
        updated_at: '2023-01-01T10:00:00Z',
      },
    ];

    mockedShared.useMyHosts.mockReturnValue({
      data: { results: mockHosts, total: 1, subtotal: 1, page: 1, per_page: 20 },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isStale: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof mockedShared.useMyHosts>);

    render(<HostsList />, { wrapper: createWrapper() });
    
    const hostRow = screen.getByText('test-host-1').closest('tr');
    if (hostRow) {
      fireEvent.click(hostRow);
      expect(mockNavigate).toHaveBeenCalledWith('/hosts/1');
    }
  });
});