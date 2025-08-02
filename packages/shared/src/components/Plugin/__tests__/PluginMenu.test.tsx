import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PluginMenu } from '../PluginMenu';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

// Mock the hooks
vi.mock('../../../plugins/hooks', () => ({
  usePluginMenuItems: vi.fn()
}));

vi.mock('../../../auth/store', () => ({
  useAuthStore: vi.fn()
}));

// Import after mocking
import { usePluginMenuItems } from '../../../plugins/hooks';
import { useAuthStore } from '../../../auth/store';

const mockUsePluginMenuItems = vi.mocked(usePluginMenuItems);
const mockUseAuthStore = vi.mocked(useAuthStore);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('PluginMenu', () => {
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

  it('should render menu items', () => {
    const mockMenuItems = [
      {
        id: 'hosts',
        labelKey: 'menu.hosts',
        path: '/hosts',
        order: 1
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        order: 2
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    expect(screen.getByText('menu.hosts')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('should render menu items with links', () => {
    const mockMenuItems = [
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        order: 1
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    const link = screen.getByRole('link', { name: 'Hosts' });
    expect(link).toHaveAttribute('href', '/hosts');
  });

  it('should filter menu items by parent ID', () => {
    const mockMenuItems = [
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        order: 1
      },
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        parent: 'infrastructure',
        order: 2
      },
      {
        id: 'users',
        label: 'Users',
        path: '/users',
        order: 3
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu parentId="infrastructure" />
      </TestWrapper>
    );

    expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument();
    expect(screen.getByText('Hosts')).toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('should render hierarchical menus', () => {
    const mockMenuItems = [
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        order: 1
      },
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        parent: 'infrastructure',
        order: 2
      },
      {
        id: 'environments',
        label: 'Environments',
        path: '/environments',
        parent: 'infrastructure',
        order: 3
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    // With flattened rendering, all items should be visible
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Hosts')).toBeInTheDocument();
    expect(screen.getByText('Environments')).toBeInTheDocument();
  });

  it('should filter items by permissions', () => {
    const mockMenuItems = [
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        permissions: ['view_hosts'], // User has this permission
        order: 1
      },
      {
        id: 'admin',
        label: 'Admin',
        path: '/admin',
        permissions: ['admin_access'], // User doesn't have this permission
        order: 2
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    expect(screen.getByText('Hosts')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('should render nothing when no menu items are available', () => {
    mockUsePluginMenuItems.mockReturnValue([]);

    const { container } = render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle horizontal layout', () => {
    const mockMenuItems = [
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        order: 1
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu isHorizontal />
      </TestWrapper>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('pf-m-horizontal');
  });

  it('should handle menu items without paths', () => {
    const mockMenuItems = [
      {
        id: 'section',
        label: 'Section Header',
        order: 1
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    const text = screen.getByText('Section Header');
    expect(text.tagName).toBe('SPAN');
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

    const mockMenuItems = [
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        permissions: ['view_hosts'],
        order: 1
      }
    ];

    mockUsePluginMenuItems.mockReturnValue(mockMenuItems);

    const { container } = render(
      <TestWrapper>
        <PluginMenu />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});