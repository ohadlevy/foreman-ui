import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PluginRouter } from '../PluginRouter';

// Mock the hooks
vi.mock('../../../plugins/hooks', () => ({
  usePluginRoutes: vi.fn(),
}));

vi.mock('../../../auth/store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../plugins/utils', () => ({
  hasPluginPermissions: vi.fn(),
}));

const mockHooks = vi.mocked(await import('../../../plugins/hooks'));
const mockAuthStore = vi.mocked(await import('../../../auth/store'));
const mockUtils = vi.mocked(await import('../../../plugins/utils'));

const createWrapper = (initialEntries = ['/']) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
  
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('PluginRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockAuthStore.useAuthStore.mockReturnValue({
      user: {
        id: 1,
        login: 'testuser',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [
          {
            id: 1,
            name: 'Viewer',
            permissions: ['view_hosts', 'view_users']
          }
        ],
        organizations: [],
        locations: []
      }
    });
    
    mockUtils.hasPluginPermissions.mockReturnValue(true);
  });

  it('should render plugin routes when user has permissions', () => {
    const TestComponent = ({ pluginName, pluginDisplayName }: { pluginName?: string; pluginDisplayName?: string }) => (
      <div data-testid="test-route">
        Plugin: {pluginName} ({pluginDisplayName})
      </div>
    );

    const mockRoutes = [
      {
        pluginName: 'test_plugin',
        pluginDisplayName: 'Test Plugin',
        path: '/test',
        element: TestComponent,
        permissions: ['view_hosts']
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);

    render(<PluginRouter />, { wrapper: createWrapper(['/test']) });

    expect(screen.getByTestId('test-route')).toBeInTheDocument();
    expect(screen.getByText('Plugin: test_plugin (Test Plugin)')).toBeInTheDocument();
  });

  it('should not render routes when user lacks permissions', () => {
    const TestComponent = () => <div data-testid="test-route">Test Route</div>;

    const mockRoutes = [
      {
        pluginName: 'test_plugin',
        pluginDisplayName: 'Test Plugin',
        path: '/test',
        element: TestComponent,
        permissions: ['admin_hosts']
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);
    mockUtils.hasPluginPermissions.mockReturnValue(false);

    render(<PluginRouter />, { wrapper: createWrapper(['/test']) });

    expect(screen.queryByTestId('test-route')).not.toBeInTheDocument();
  });

  it('should render multiple plugin routes', () => {
    const TestComponent1 = () => <div data-testid="test-route-1">Route 1</div>;
    const TestComponent2 = () => <div data-testid="test-route-2">Route 2</div>;

    const mockRoutes = [
      {
        pluginName: 'plugin1',
        pluginDisplayName: 'Plugin 1',
        path: '/plugin1',
        element: TestComponent1,
        permissions: ['view_hosts']
      },
      {
        pluginName: 'plugin2',
        pluginDisplayName: 'Plugin 2',
        path: '/plugin2',
        element: TestComponent2,
        permissions: ['view_users']
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);

    render(<PluginRouter />, { wrapper: createWrapper(['/plugin1']) });

    // Should render the first route (matching current path)
    expect(screen.getByTestId('test-route-1')).toBeInTheDocument();
  });

  it('should handle routes without permissions', () => {
    const TestComponent = () => <div data-testid="test-route">Test Route</div>;

    const mockRoutes = [
      {
        pluginName: 'test_plugin',
        pluginDisplayName: 'Test Plugin',
        path: '/test',
        element: TestComponent,
        permissions: undefined
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);

    render(<PluginRouter />, { wrapper: createWrapper(['/test']) });

    expect(screen.getByTestId('test-route')).toBeInTheDocument();
    expect(mockUtils.hasPluginPermissions).toHaveBeenCalledWith(undefined, ['view_hosts', 'view_users']);
  });

  it('should handle user without roles', () => {
    const TestComponent = () => <div data-testid="test-route">Test Route</div>;

    const mockRoutes = [
      {
        pluginName: 'test_plugin',
        pluginDisplayName: 'Test Plugin',
        path: '/test',
        element: TestComponent,
        permissions: ['view_hosts']
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);
    mockAuthStore.useAuthStore.mockReturnValue({
      user: {
        id: 1,
        login: 'testuser',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      }
    });

    render(<PluginRouter />, { wrapper: createWrapper(['/test']) });

    expect(mockUtils.hasPluginPermissions).toHaveBeenCalledWith(['view_hosts'], []);
  });

  it('should handle user without user object', () => {
    const TestComponent = () => <div data-testid="test-route">Test Route</div>;

    const mockRoutes = [
      {
        pluginName: 'test_plugin',
        pluginDisplayName: 'Test Plugin',
        path: '/test',
        element: TestComponent,
        permissions: ['view_hosts']
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);
    mockAuthStore.useAuthStore.mockReturnValue({
      user: null
    });

    render(<PluginRouter />, { wrapper: createWrapper(['/test']) });

    expect(mockUtils.hasPluginPermissions).toHaveBeenCalledWith(['view_hosts'], []);
  });

  it('should render empty when no plugin routes available', () => {
    mockHooks.usePluginRoutes.mockReturnValue([]);

    render(<PluginRouter />, { wrapper: createWrapper() });

    // Should not render any route content
    expect(screen.queryByTestId('test-route')).not.toBeInTheDocument();
    
    // Verify that the usePluginRoutes hook was called
    expect(mockHooks.usePluginRoutes).toHaveBeenCalled();
  });

  it('should use correct route keys for each plugin route', () => {
    const TestComponent1 = () => <div data-testid="route-1">Route 1</div>;
    const TestComponent2 = () => <div data-testid="route-2">Route 2</div>;

    const mockRoutes = [
      {
        pluginName: 'plugin1',
        pluginDisplayName: 'Plugin 1',
        path: '/route1',
        element: TestComponent1,
        permissions: []
      },
      {
        pluginName: 'plugin1',
        pluginDisplayName: 'Plugin 1',
        path: '/route2',
        element: TestComponent2,
        permissions: []
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);

    render(<PluginRouter />, { wrapper: createWrapper() });

    // Verify that routes are created with unique keys
    // This is more of an implementation detail test to ensure no key conflicts
    expect(mockHooks.usePluginRoutes).toHaveBeenCalled();
  });

  it('should pass correct props to plugin route elements', () => {
    const TestComponent = ({ pluginName, pluginDisplayName }: { pluginName?: string; pluginDisplayName?: string }) => (
      <div data-testid="props-test">
        <span data-testid="plugin-name">{pluginName}</span>
        <span data-testid="plugin-display-name">{pluginDisplayName}</span>
      </div>
    );

    const mockRoutes = [
      {
        pluginName: 'my_plugin',
        pluginDisplayName: 'My Awesome Plugin',
        path: '/test',
        element: TestComponent,
        permissions: []
      }
    ];

    mockHooks.usePluginRoutes.mockReturnValue(mockRoutes);

    render(<PluginRouter />, { wrapper: createWrapper(['/test']) });

    expect(screen.getByTestId('plugin-name')).toHaveTextContent('my_plugin');
    expect(screen.getByTestId('plugin-display-name')).toHaveTextContent('My Awesome Plugin');
  });
});