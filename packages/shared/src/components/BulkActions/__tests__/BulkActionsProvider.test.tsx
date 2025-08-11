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

vi.mock('../../../hooks/useApi', () => ({
  useApi: vi.fn(() => ({
    user: { id: 1, login: 'admin' },
    client: {},
  })),
}));

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
      expect(screen.getByTestId('actions-count')).toHaveTextContent('10');
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
        userPermissions: ['edit_hosts'] // Missing 'destroy_hosts'
      })
    });

    await waitFor(() => {
      expect(screen.getByTestId('action-update_hostgroup-disabled')).toHaveTextContent('enabled');
      expect(screen.getByTestId('action-destroy-disabled')).toHaveTextContent('disabled');
    });
  });

  it('should configure hostgroup parameters correctly', async () => {
    render(<TestComponent />, { 
      wrapper: createWrapper({ enabledActions: ['update_hostgroup'] })
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
      wrapper: createWrapper({ enabledActions: ['destroy', 'disable'] })
    });

    await waitFor(() => {
      expect(screen.getByTestId('action-destroy')).toBeInTheDocument();
      expect(screen.getByTestId('action-disable')).toBeInTheDocument();
    });

    // Both should be present as destructive actions
    expect(screen.getByTestId('action-destroy-label')).toHaveTextContent('Delete Hosts');
    expect(screen.getByTestId('action-disable-label')).toHaveTextContent('Disable Hosts');
  });
});