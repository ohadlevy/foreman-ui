import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardWidgets } from '../DashboardWidgets';

// Mock our safe useTranslation wrapper
vi.mock('../../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

// Mock the hooks
vi.mock('../../../plugins/hooks', () => ({
  usePluginDashboardWidgets: vi.fn()
}));

vi.mock('../../../auth/store', () => ({
  useAuthStore: vi.fn()
}));

// Import after mocking
import { usePluginDashboardWidgets } from '../../../plugins/hooks';
import { useAuthStore } from '../../../auth/store';

const mockUsePluginDashboardWidgets = vi.mocked(usePluginDashboardWidgets);
const mockUseAuthStore = vi.mocked(useAuthStore);

// Test widget components
const TestWidget1 = ({ widgetId, title }: { widgetId?: string; title?: string }) => (
  <div data-testid={`widget-${widgetId}`}>
    Widget: {title} (ID: {widgetId})
  </div>
);

const TestWidget2 = ({ widgetId }: { widgetId?: string }) => (
  <div data-testid={`widget-${widgetId}`}>
    Simple Widget {widgetId}
  </div>
);

describe('DashboardWidgets', () => {
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
              { name: 'view_reports', resource_type: 'Report' }
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

  it('should render dashboard widgets', () => {
    const mockWidgets = [
      {
        id: 'hosts-overview',
        titleKey: 'widgets.hosts_overview',
        component: TestWidget1,
        size: 'medium' as const
      },
      {
        id: 'reports-summary',
        title: 'Reports Summary',
        component: TestWidget2,
        size: 'small' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    render(<DashboardWidgets />);

    expect(screen.getByTestId('widget-hosts-overview')).toBeInTheDocument();
    expect(screen.getByTestId('widget-reports-summary')).toBeInTheDocument();
    expect(screen.getByText('widgets.hosts_overview')).toBeInTheDocument();
    expect(screen.getByText('Reports Summary')).toBeInTheDocument();
  });

  it('should handle widgets without titles', () => {
    const mockWidgets = [
      {
        id: 'simple-widget',
        component: TestWidget2,
        size: 'small' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    render(<DashboardWidgets />);

    expect(screen.getByTestId('widget-simple-widget')).toBeInTheDocument();
    // Should not render CardTitle when no title is provided
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should filter widgets by permissions', () => {
    const mockWidgets = [
      {
        id: 'hosts-widget',
        title: 'Hosts Widget',
        component: TestWidget1,
        permissions: ['view_hosts'], // User has this permission
        size: 'medium' as const
      },
      {
        id: 'admin-widget',
        title: 'Admin Widget',
        component: TestWidget2,
        permissions: ['admin_access'], // User doesn't have this permission
        size: 'small' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    render(<DashboardWidgets />);

    expect(screen.getByTestId('widget-hosts-widget')).toBeInTheDocument();
    expect(screen.queryByTestId('widget-admin-widget')).not.toBeInTheDocument();
  });

  it('should render nothing when no widgets are available', () => {
    mockUsePluginDashboardWidgets.mockReturnValue([]);

    const { container } = render(<DashboardWidgets />);

    expect(container.firstChild).toBeNull();
  });

  it('should handle different widget sizes', () => {
    const mockWidgets = [
      {
        id: 'small-widget',
        title: 'Small Widget',
        component: TestWidget1,
        size: 'small' as const
      },
      {
        id: 'medium-widget',
        title: 'Medium Widget',
        component: TestWidget1,
        size: 'medium' as const
      },
      {
        id: 'large-widget',
        title: 'Large Widget',
        component: TestWidget1,
        size: 'large' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    render(<DashboardWidgets columns={3} />);

    expect(screen.getByTestId('widget-small-widget')).toBeInTheDocument();
    expect(screen.getByTestId('widget-medium-widget')).toBeInTheDocument();
    expect(screen.getByTestId('widget-large-widget')).toBeInTheDocument();

    expect(screen.getByText('Small Widget')).toBeInTheDocument();
    expect(screen.getByText('Medium Widget')).toBeInTheDocument();
    expect(screen.getByText('Large Widget')).toBeInTheDocument();
  });

  it('should handle custom column count', () => {
    const mockWidgets = [
      {
        id: 'widget-1',
        title: 'Widget 1',
        component: TestWidget1,
        size: 'small' as const
      },
      {
        id: 'widget-2',
        title: 'Widget 2',
        component: TestWidget1,
        size: 'small' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    render(<DashboardWidgets columns={2} />);

    expect(screen.getByTestId('widget-widget-1')).toBeInTheDocument();
    expect(screen.getByTestId('widget-widget-2')).toBeInTheDocument();
    expect(screen.getByText('Widget 1')).toBeInTheDocument();
    expect(screen.getByText('Widget 2')).toBeInTheDocument();
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

    const mockWidgets = [
      {
        id: 'protected-widget',
        title: 'Protected Widget',
        component: TestWidget1,
        permissions: ['view_hosts'],
        size: 'medium' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    const { container } = render(<DashboardWidgets />);

    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    const mockWidgets = [
      {
        id: 'test-widget',
        title: 'Test Widget',
        component: TestWidget1,
        size: 'small' as const
      }
    ];

    mockUsePluginDashboardWidgets.mockReturnValue(mockWidgets);

    const { container } = render(<DashboardWidgets className="custom-dashboard" />);

    expect(container.firstChild).toHaveClass('custom-dashboard');
  });
});