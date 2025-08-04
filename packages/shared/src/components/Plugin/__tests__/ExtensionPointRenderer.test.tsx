import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExtensionPointRenderer } from '../ExtensionPointRenderer';
import { EXTENSION_POINTS } from '../../../plugins/types';

// Mock the hooks
vi.mock('../../../plugins/hooks', () => ({
  usePluginExtensions: vi.fn()
}));

vi.mock('../../../auth/store', () => ({
  useAuthStore: vi.fn()
}));

// Import after mocking
import { usePluginExtensions } from '../../../plugins/hooks';
import { useAuthStore } from '../../../auth/store';

const mockUsePluginExtensions = vi.mocked(usePluginExtensions);
const mockUseAuthStore = vi.mocked(useAuthStore);

// Test components
const TestComponent1 = ({ context }: { context?: unknown }) => (
  <div data-testid="test-component-1">Test Component 1 - {JSON.stringify(context)}</div>
);

const TestComponent2 = ({ context }: { context?: unknown }) => (
  <div data-testid="test-component-2">Test Component 2 - {JSON.stringify(context)}</div>
);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="wrapper">{children}</div>
);

describe('ExtensionPointRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth store mock
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 1,
        login: 'testuser',
        roles: [
          {
            id: 1,
            name: 'Test Role',
            builtin: false,
            permissions: [
              { name: 'view_hosts', resource_type: 'Host' },
              { name: 'edit_hosts', resource_type: 'Host' }
            ]
          }
        ]
      },
      token: 'test-token',
      isLoading: false,
      error: null,
      login: vi.fn(),
      loginWithToken: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: () => false,
      isLoginLoading: false,
      isLogoutLoading: false,
    });
  });

  it('should render extensions for a given extension point', () => {
    const mockExtensions = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent1,
        order: 1
      },
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent2,
        order: 2
      }
    ];

    mockUsePluginExtensions.mockReturnValue(mockExtensions);

    render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
      />
    );

    expect(screen.getByTestId('test-component-1')).toBeInTheDocument();
    expect(screen.getByTestId('test-component-2')).toBeInTheDocument();
  });

  it('should pass context to extension components', () => {
    const mockExtensions = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent1,
        order: 1
      }
    ];

    const testContext = { hostId: '123', name: 'test-host' };
    mockUsePluginExtensions.mockReturnValue(mockExtensions);

    render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
        context={testContext}
      />
    );

    expect(screen.getByText(/Test Component 1 - {"hostId":"123","name":"test-host"}/)).toBeInTheDocument();
  });

  it('should wrap extensions when wrapper is provided', () => {
    const mockExtensions = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent1,
        order: 1
      }
    ];

    mockUsePluginExtensions.mockReturnValue(mockExtensions);

    render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
        wrapper={TestWrapper}
      />
    );

    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('test-component-1')).toBeInTheDocument();
  });

  it('should pass extension props to components', () => {
    const TestComponentWithProps = (props: any) => (
      <div data-testid="test-component-props">
        Props: {JSON.stringify(props)}
      </div>
    );

    const mockExtensions = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponentWithProps,
        order: 1
      }
    ];

    mockUsePluginExtensions.mockReturnValue(mockExtensions);

    render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
        extensionProps={{ customProp: 'test-value' }}
      />
    );

    expect(screen.getByText(/customProp":"test-value"/)).toBeInTheDocument();
  });

  it('should render nothing when no extensions are available', () => {
    mockUsePluginExtensions.mockReturnValue([]);

    const { container } = render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should filter extensions by permissions', () => {
    const mockExtensions = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent1,
        permissions: ['view_hosts'], // User has this permission
        order: 1
      },
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent2,
        permissions: ['admin_access'], // User doesn't have this permission
        order: 2
      }
    ];

    mockUsePluginExtensions.mockReturnValue(mockExtensions);

    render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
      />
    );

    expect(screen.getByTestId('test-component-1')).toBeInTheDocument();
    expect(screen.queryByTestId('test-component-2')).not.toBeInTheDocument();
  });

  it('should handle user with no permissions', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      loginWithToken: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: () => false,
      isLoginLoading: false,
      isLogoutLoading: false,
    });

    const mockExtensions = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: TestComponent1,
        permissions: ['view_hosts'],
        order: 1
      }
    ];

    mockUsePluginExtensions.mockReturnValue(mockExtensions);

    const { container } = render(
      <ExtensionPointRenderer
        extensionPoint={EXTENSION_POINTS.HOST_DETAILS_TABS}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});