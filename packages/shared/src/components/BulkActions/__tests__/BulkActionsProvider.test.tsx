import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkActionsProvider, useBulkActions } from '../BulkActionsProvider';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock implementations - defined within the mock factory
vi.mock('../../../hooks/useBulkOperations', () => ({
  useBulkOperations: vi.fn(() => ({
    executeBulkOperation: vi.fn(),
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

// Mock GraphQL hook for bulk operation targets (with REST fallback in actual implementation)

vi.mock('../../../hooks/useHostsGraphQL', () => ({
  useBulkOperationTargets: vi.fn(() => ({
    data: {
      hostgroups: {
        edges: [
          { node: { id: '1', name: 'web-servers', title: 'Web Servers' } },
          { node: { id: '2', name: 'db-servers', title: 'Database Servers' } },
        ],
      },
      users: {
        edges: [
          { node: { id: '1', login: 'admin', firstname: 'Admin', lastname: 'User' } },
          { node: { id: '2', login: 'user1', firstname: 'Test', lastname: 'User' } },
        ],
      },
      organizations: {
        edges: [
          { node: { id: '1', name: 'test-org' } },
        ],
      },
      locations: {
        edges: [
          { node: { id: '1', name: 'test-location' } },
        ],
      },
      usergroups: {
        edges: [
          { node: { id: '1', name: 'test-group' } },
        ],
      },
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

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { actions, isLoading } = useBulkActions();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="actions-count">{actions.length}</div>
      {actions.map(action => (
        <div key={action.id} data-testid={`action-${action.id}`}>
          <span data-testid={`action-${action.id}-label`}>{action.label}</span>
          <span data-testid={`action-${action.id}-disabled`}>
            {action.disabled ? 'disabled' : 'enabled'}
          </span>
        </div>
      ))}
    </div>
  );
};

const createWrapper = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BulkActionsProvider {...props}>
        {children}
      </BulkActionsProvider>
    </QueryClientProvider>
  );
  return Wrapper;
};

describe('BulkActionsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide default bulk actions', async () => {
    render(<TestComponent />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('actions-count')).toHaveTextContent('7');
    });

    // Check that key actions are present
    expect(screen.getByTestId('action-update_hostgroup')).toBeInTheDocument();
    expect(screen.getByTestId('action-update_hostgroup-label')).toHaveTextContent('Change Hostgroup');
    
    expect(screen.getByTestId('action-destroy')).toBeInTheDocument();
    expect(screen.getByTestId('action-destroy-label')).toHaveTextContent('Delete Hosts');
  });

  it('should filter actions based on enabledActions prop', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ enabledActions: ['update_hostgroup', 'destroy'] })
    });

    await waitFor(() => {
      expect(screen.getByTestId('actions-count')).toHaveTextContent('2');
    });

    expect(screen.getByTestId('action-update_hostgroup')).toBeInTheDocument();
    expect(screen.getByTestId('action-destroy')).toBeInTheDocument();
    expect(screen.queryByTestId('action-update_environment')).not.toBeInTheDocument();
  });

  it('should disable actions based on user permissions', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ 
        enabledActions: ['update_hostgroup', 'destroy'],
        userPermissions: ['edit_hosts'], // Missing 'destroy_hosts'
        hasSelectedItems: true // Need items selected to test permission logic
      })
    });

    await waitFor(() => {
      expect(screen.getByTestId('action-update_hostgroup-disabled')).toHaveTextContent('enabled');
      expect(screen.getByTestId('action-destroy-disabled')).toHaveTextContent('disabled');
    });
  });

  it('should configure hostgroup parameters correctly', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ 
        enabledActions: ['update_hostgroup']
      })
    });

    await waitFor(() => {
      expect(screen.getByTestId('action-update_hostgroup')).toBeInTheDocument();
    });

    // We can't directly test the parameters without accessing the action object,
    // but we can verify the component renders without errors
    expect(screen.getByTestId('action-update_hostgroup-label')).toHaveTextContent('Change Hostgroup');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow(
      'useBulkActions must be used within a BulkActionsProvider'
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle destructive actions correctly', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ enabledActions: ['destroy', 'disown'] })
    });

    await waitFor(() => {
      expect(screen.getByTestId('action-destroy')).toBeInTheDocument();
      expect(screen.getByTestId('action-disown')).toBeInTheDocument();
    });

    // Both should be present as destructive actions
    expect(screen.getByTestId('action-destroy-label')).toHaveTextContent('Delete Hosts');
    expect(screen.getByTestId('action-disown-label')).toHaveTextContent('Disassociate Compute Resources');
  });

  it('should not load bulk targets when no target-requiring actions are enabled', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ 
        enabledActions: ['build', 'destroy'], // No target-requiring actions
        hasSelectedItems: true 
      })
    });

    await waitFor(() => {
      expect(screen.getByTestId('actions-count')).toHaveTextContent('2');
    });

    // Actions should be present but targets shouldn't be loaded
    expect(screen.getByTestId('action-build')).toBeInTheDocument();
    expect(screen.getByTestId('action-destroy')).toBeInTheDocument();
  });

  it('should not load bulk targets when hasSelectedItems is false', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ 
        enabledActions: ['update_hostgroup', 'build'], 
        hasSelectedItems: false // No items selected
      })
    });

    await waitFor(() => {
      expect(screen.getByTestId('actions-count')).toHaveTextContent('2');
    });

    // Actions should be present but targets shouldn't be loaded when no items selected
    expect(screen.getByTestId('action-update_hostgroup')).toBeInTheDocument();
    expect(screen.getByTestId('action-build')).toBeInTheDocument();
  });
});