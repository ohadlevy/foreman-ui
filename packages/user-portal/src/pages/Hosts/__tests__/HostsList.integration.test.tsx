import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { HostsList } from '../HostsList';

// Mock the shared package hooks and components
vi.mock('@foreman/shared', () => ({
  useHosts: () => ({
    data: {
      results: [
        { id: 1, name: 'host1.example.com', enabled: true, build: false },
        { id: 2, name: 'host2.example.com', enabled: false, build: true },
        { id: 3, name: 'host3.example.com', enabled: true, build: false },
      ],
      total: 3,
    },
    isLoading: false,
    error: null,
  }),
  usePermissions: () => ({
    canCreateHosts: () => true,
    canEditHosts: () => true,
    canDeleteHosts: () => true,
    canBuildHosts: () => true,
  }),
  formatDateTime: (date: string) => date,
  formatRelativeTime: (date: string) => `${date} ago`,
  LoadingSpinner: () => <div>Loading...</div>,
  RecentHosts: () => <div>Recent Hosts</div>,
  RecentSearches: () => <div>Recent Searches</div>,
  useActivityStore: () => ({
    addActivity: vi.fn(),
  }),
  pluginRegistry: {
    getPluginsWithExtensions: () => [],
    subscribe: () => () => {},
  },
  EXTENSION_POINTS: {
    HOST_TABLE_COLUMNS: 'host_table_columns',
  },
  useBulkSelection: (_options: unknown) => ({
    selectedIds: [],
    selectedObjects: [],
    selectedCount: 0,
    isSelected: () => false,
    isAllCurrentPageSelected: false,
    isPartiallySelected: false,
    toggleItem: vi.fn(),
    toggleAll: vi.fn(),
    clearSelection: vi.fn(),
    selectAllPages: vi.fn(),
  }),
  BulkActionsProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="bulk-actions-provider">{children}</div>,
  BulkActionsContainer: ({ selectedItems }: { selectedItems: unknown[] }) => (
    <div data-testid="bulk-actions-container">
      Bulk Actions ({selectedItems.length} selected)
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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


describe('HostsList Integration', () => {
  it('should render the bulk actions integration', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <HostsList />
      </Wrapper>
    );

    // Check that the component renders
    expect(screen.getByText('Hosts')).toBeInTheDocument();
    
    // Check that the bulk actions provider is present
    expect(screen.getByTestId('bulk-actions-provider')).toBeInTheDocument();
    
    // Check that hosts are displayed
    await waitFor(() => {
      expect(screen.getByText('host1.example.com')).toBeInTheDocument();
      expect(screen.getByText('host2.example.com')).toBeInTheDocument();
      expect(screen.getByText('host3.example.com')).toBeInTheDocument();
    });

    // Check that selection checkboxes are present
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0); // At least the header checkbox
  });

  it('should handle host selection', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <HostsList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('host1.example.com')).toBeInTheDocument();
    });

    // Check that checkboxes are present (PatternFly table selection)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('should render table with selection column', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <HostsList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('host1.example.com')).toBeInTheDocument();
    });

    // Check that selection checkboxes are present for the table
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4); // 1 header + 3 host checkboxes
  });

  it('should integrate with bulk selection system', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <HostsList />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('host1.example.com')).toBeInTheDocument();
    });

    // Verify bulk actions system is integrated
    expect(screen.getByTestId('bulk-actions-provider')).toBeInTheDocument();
    
    // Check that selection system is in place (checkboxes rendered)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4); // 1 header + 3 host checkboxes
  });
});