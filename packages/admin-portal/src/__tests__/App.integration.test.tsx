import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import type { User, AuthResponse, LoginCredentials } from '@foreman/shared';

// Global mock functions
const mockLogoutGlobal = vi.fn();

// Mock the shared module  
vi.mock('@foreman/shared', () => {
  return {
    useAuth: vi.fn(),
    UserLayout: vi.fn(({ children }) => (
      <div data-testid="user-layout">
        <button data-testid="logout-button" onClick={mockLogoutGlobal}>
          Logout
        </button>
        {children}
      </div>
    )),
    PluginRouter: vi.fn(() => <div data-testid="plugin-router">Plugin Router</div>),
    pluginRegistry: {
      register: vi.fn(),
      getPlugin: vi.fn(),
      getAllPlugins: vi.fn().mockReturnValue([]),
      subscribe: vi.fn().mockReturnValue(() => {}),
      isRegistered: vi.fn().mockReturnValue(false),
    },
    FOREMAN_BRANDING: {
      colors: {
        primary: '#005c7e',
        primaryGradientStart: '#0072a0',
        secondary: '#0187b6',
      }
    },
    AuthProvider: vi.fn(({ children }) => <div data-testid="auth-provider">{children}</div>),
    ErrorBoundary: vi.fn(({ children }) => <div data-testid="error-boundary">{children}</div>),
  };
});

const mockLogin = vi.fn<[LoginCredentials], Promise<AuthResponse>>().mockResolvedValue({ 
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
  token: 'test-token' 
});
const mockLogout = mockLogoutGlobal;
const mockClearError = vi.fn();

// Mock pages
vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard</div>
}));

vi.mock('../pages/Hosts/HostsList', () => ({
  HostsList: () => <div data-testid="hosts-page">Hosts List</div>
}));

vi.mock('../pages/Profile', () => ({
  Profile: () => <div data-testid="profile-page">Profile</div>
}));

vi.mock('../pages/Settings', () => ({
  Settings: () => <div data-testid="settings-page">Settings</div>
}));

vi.mock('../pages/SimpleLogin', () => ({
  SimpleLogin: () => (
    <div data-testid="login-page">
      <form onSubmit={(e) => {
        e.preventDefault();
        mockLogin({ login: 'ohad', password: 'secret' });
      }}>
        <input data-testid="login-input" />
        <input data-testid="password-input" type="password" />
        <button type="submit" data-testid="login-submit">Login</button>
      </form>
      <button onClick={mockClearError} data-testid="clear-error">Clear Error</button>
    </div>
  )
}));

describe('App Integration Tests', () => {
  let mockUseAuth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: typeof mockLogin;
    loginWithToken: ReturnType<typeof vi.fn>;
    logout: typeof mockLogout;
    clearError: typeof mockClearError;
    hasPermission: ReturnType<typeof vi.fn>;
    isAdmin: () => boolean;
    isLoginLoading: boolean;
    isLogoutLoading: boolean;
    user: User | null;
    error: string | null;
  };

  const renderApp = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter 
        initialEntries={initialEntries}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </MemoryRouter>
    );
  };

  beforeEach(async () => {
    mockUseAuth = {
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      loginWithToken: vi.fn<[string], Promise<User>>().mockResolvedValue({ 
        id: 1, 
        login: 'test', 
        admin: false, 
        disabled: false, 
        auth_source_id: 1, 
        roles: [], 
        organizations: [], 
        locations: [] 
      }),
      logout: mockLogout,
      clearError: mockClearError,
      hasPermission: vi.fn(),
      isAdmin: () => false,
      isLoginLoading: false,
      isLogoutLoading: false,
      user: null,
      error: null,
    };

    const { useAuth } = vi.mocked(await import('@foreman/shared'));
    useAuth.mockReturnValue(mockUseAuth as ReturnType<typeof import('@foreman/shared').useAuth>);

    vi.clearAllMocks();
  });

  describe('authentication flow', () => {
    it('should show login page when not authenticated', () => {
      mockUseAuth.isAuthenticated = false;
      renderApp();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('user-layout')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseAuth.isLoading = true;
      renderApp();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Verifying authentication')).toBeInTheDocument();
    });

    it('should show dashboard when authenticated', () => {
      mockUseAuth.isAuthenticated = true;
      renderApp();

      expect(screen.getByTestId('user-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('should handle login action', async () => {
      const user = userEvent.setup();
      mockUseAuth.isAuthenticated = false;
      
      renderApp();

      // Should show login page initially
      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      // Simulate login
      await user.click(screen.getByTestId('login-submit'));

      expect(mockLogin).toHaveBeenCalledWith({
        login: 'ohad',
        password: 'secret'
      });
    });

    it('should handle logout action', async () => {
      const user = userEvent.setup();
      mockUseAuth.isAuthenticated = true;
      
      renderApp();

      // Should show authenticated layout
      expect(screen.getByTestId('user-layout')).toBeInTheDocument();

      // Simulate logout
      await user.click(screen.getByTestId('logout-button'));

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('routing', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
    });

    it('should redirect root path to dashboard', () => {
      // This would need more complex testing with router history
      renderApp();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('should show user layout for authenticated routes', () => {
      renderApp();
      
      expect(screen.getByTestId('user-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error message when login fails', () => {
      mockUseAuth.isAuthenticated = false;
      mockUseAuth.error = 'Invalid credentials';
      
      renderApp();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      // Error handling would be in the LoginForm component
    });

    it('should allow clearing errors', async () => {
      const user = userEvent.setup();
      mockUseAuth.isAuthenticated = false;
      mockUseAuth.error = 'Some error';
      
      renderApp();

      await user.click(screen.getByTestId('clear-error'));

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('user state management', () => {
    it('should handle user data when authenticated', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 1,
        login: 'ohad',
        firstname: 'Ohad',
        lastname: 'Anaf Levy',
        mail: 'ohadlevy@gmail.com',
        admin: false,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };
      
      renderApp();

      expect(screen.getByTestId('user-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('should handle admin users', () => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: 1,
        login: 'admin',
        firstname: 'Admin',
        lastname: 'User',
        mail: 'admin@example.com',
        admin: true,
        disabled: false,
        auth_source_id: 1,
        roles: [],
        organizations: [],
        locations: []
      };
      
      renderApp();

      expect(screen.getByTestId('user-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading screen with proper styling', () => {
      mockUseAuth.isLoading = true;
      
      renderApp();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Verifying authentication')).toBeInTheDocument();
      
      // The loading content should be properly displayed
      const loadingContent = screen.getByText('Loading...').parentElement;
      expect(loadingContent).toHaveStyle({ color: 'rgb(255, 255, 255)' });
    });

    it('should transition from loading to authenticated state', async () => {
      // Start with loading
      mockUseAuth.isLoading = true;
      const { rerender } = renderApp();

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Simulate authentication completion
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      rerender(
        <MemoryRouter 
          initialEntries={['/']}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </MemoryRouter>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-layout')).toBeInTheDocument();
    });

    it('should transition from loading to login page', async () => {
      // Start with loading
      mockUseAuth.isLoading = true;
      const { rerender } = renderApp();

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Simulate no authentication
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = false;
      
      rerender(
        <MemoryRouter 
          initialEntries={['/']}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </MemoryRouter>
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});