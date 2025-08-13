import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkActionsContainer } from '../BulkActionsContainer';
import { BulkActionsProvider } from '../BulkActionsProvider';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock the hooks
vi.mock('../../../hooks/useBulkOperations', () => ({
  useBulkOperations: vi.fn(() => ({
    executeBulkOperation: vi.fn().mockResolvedValue({
      success_count: 3,
      failed_count: 0,
      errors: [],
    }),
    getOperationsConfig: vi.fn(() => []),
    bulkOperation: { isPending: false, isError: false, error: null },
    updateHostgroup: { mutateAsync: vi.fn() },
    updateEnvironment: { mutateAsync: vi.fn() },
    updateOwner: { mutateAsync: vi.fn() },
    updateOrganization: { mutateAsync: vi.fn() },
    updateLocation: { mutateAsync: vi.fn() },
    build: { mutateAsync: vi.fn() },
    destroy: { mutateAsync: vi.fn() },
    enable: { mutateAsync: vi.fn() },
    disable: { mutateAsync: vi.fn() },
    disown: { mutateAsync: vi.fn() },
    retryFailedHosts: vi.fn(),
    getOperationConfig: vi.fn(),
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

vi.mock('../../../hooks/useHostGroups', () => ({
  useHostGroups: vi.fn(() => ({
    data: {
      results: [
        { id: 1, name: 'web-servers', title: 'Web Servers' },
        { id: 2, name: 'db-servers', title: 'Database Servers' },
      ],
    },
    isLoading: false,
    error: null,
    isError: false,
  })),
}));

vi.mock('../../../hooks/useUsers', () => ({
  useUsers: vi.fn(() => ({
    data: {
      results: [
        { id: 1, login: 'admin', name: 'Administrator' },
        { id: 2, login: 'user1', name: 'User One' },
      ],
    },
    isLoading: false,
    error: null,
    isError: false,
  })),
}));

vi.mock('../../../hooks/useApi', () => ({
  useApi: vi.fn(() => ({
    user: { id: 1, login: 'admin' },
    client: {},
  })),
}));

// Mock React Query for organizations and locations
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query') as Record<string, unknown>;
  return {
    ...actual,
    useQuery: vi.fn((options: { queryKey: string[] }) => {
      // Mock organizations and locations queries
      if (options.queryKey[0] === 'organizations') {
        return {
          data: { results: [{ id: 1, name: 'test-org', title: 'Test Organization' }] },
          isLoading: false,
          error: null,
          isError: false,
        };
      }
      if (options.queryKey[0] === 'locations') {
        return {
          data: { results: [{ id: 1, name: 'test-location', title: 'Test Location' }] },
          isLoading: false,
          error: null,
          isError: false,
        };
      }
      // Default mock for other queries
      return {
        data: undefined,
        isLoading: false,
        error: null,
        isError: false,
      };
    }),
  };
});

const mockSelectedItems = [
  { id: 1, name: 'host1.example.com' },
  { id: 2, name: 'host2.example.com' },
  { id: 3, name: 'host3.example.com' },
];

const defaultProps = {
  selectedItems: mockSelectedItems,
  totalCount: 10,
  onClearSelection: vi.fn(),
  onSelectAllPages: vi.fn(),
  showSelectAllPages: true,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BulkActionsProvider
        enabledActions={['update_hostgroup', 'build', 'destroy']}
        userPermissions={['edit_hosts', 'build_hosts', 'destroy_hosts']}
      >
        {children}
      </BulkActionsProvider>
    </QueryClientProvider>
  );
  return Wrapper;
};

describe('BulkActionsContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render bulk action toolbar with selected items', () => {
    render(<BulkActionsContainer {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('3 of 10 selected')).toBeInTheDocument();
    expect(screen.getByText('Clear selection')).toBeInTheDocument();
    expect(screen.getByText('Select all 10 items')).toBeInTheDocument();
  });

  it('should show available actions for selected items', () => {
    render(<BulkActionsContainer {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText('Change Hostgroup')).toBeInTheDocument();
    expect(screen.getByText('Rebuild Hosts')).toBeInTheDocument();
    expect(screen.getByText('More actions')).toBeInTheDocument();
  });

  it('should open modal when clicking action requiring confirmation', async () => {
    const user = userEvent.setup();
    render(<BulkActionsContainer {...defaultProps} />, { wrapper: createWrapper() });

    // Click on the "Rebuild Hosts" button (which doesn't require confirmation but will open modal)
    await user.click(screen.getByText('Rebuild Hosts'));

    // Modal should open with rebuild confirmation
    await waitFor(() => {
      expect(screen.getByText('This will mark the selected hosts for rebuild on next boot.')).toBeInTheDocument();
    });
    
    // Check that it shows the action affects selected items (text is split by strong tags)
    expect(screen.getByText(/This action will affect/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/selected items:/)).toBeInTheDocument();
    
    // Check selected items are listed
    expect(screen.getByText('host1.example.com')).toBeInTheDocument();
    expect(screen.getByText('host2.example.com')).toBeInTheDocument();
    expect(screen.getByText('host3.example.com')).toBeInTheDocument();
  });

  it('should execute rebuild action through modal', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkActionsContainer 
        {...defaultProps}
        selectedItems={mockSelectedItems}
      />, 
      { wrapper: createWrapper() }
    );

    // Click rebuild hosts to open modal
    await user.click(screen.getByText('Rebuild Hosts'));

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('This will mark the selected hosts for rebuild on next boot.')).toBeInTheDocument();
    });

    // Click Apply button in modal
    await user.click(screen.getByText('Apply'));

    // The operation should complete and show success message
    await waitFor(() => {
      expect(screen.getByText(/Successfully completed 3 operations/)).toBeInTheDocument();
    });
  });

  it('should call onClearSelection when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockClearSelection = vi.fn();
    
    render(
      <BulkActionsContainer 
        {...defaultProps}
        onClearSelection={mockClearSelection}
      />, 
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Clear selection'));

    expect(mockClearSelection).toHaveBeenCalled();
  });

  it('should call onSelectAllPages when select all button is clicked', async () => {
    const user = userEvent.setup();
    const mockSelectAllPages = vi.fn();
    
    render(
      <BulkActionsContainer 
        {...defaultProps}
        onSelectAllPages={mockSelectAllPages}
      />, 
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Select all 10 items'));

    expect(mockSelectAllPages).toHaveBeenCalled();
  });

  it('should not show toolbar when no items are selected', () => {
    render(
      <BulkActionsContainer 
        {...defaultProps}
        selectedItems={[]}
      />, 
      { wrapper: createWrapper() }
    );

    // Toolbar should be hidden (but still rendered for layout purposes)
    expect(screen.queryByText('Clear selection')).not.toBeInTheDocument();
  });

  it('should handle basic bulk action functionality', () => {
    render(<BulkActionsContainer {...defaultProps} />, { wrapper: createWrapper() });

    // Basic rendering test - check visible buttons
    expect(screen.getByText('Change Hostgroup')).toBeInTheDocument();
    expect(screen.getByText('Rebuild Hosts')).toBeInTheDocument();
    expect(screen.getByText('More actions')).toBeInTheDocument();
  });
});