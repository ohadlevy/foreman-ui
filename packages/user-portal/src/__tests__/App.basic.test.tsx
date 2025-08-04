import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@foreman/shared';
import App from '../App';

// Mock all dependencies
vi.mock('../plugins/pluginLoader', () => ({
  pluginLoader: {
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock UserApp and AdminApp with simple placeholders
vi.mock('../UserApp', () => ({
  UserApp: () => <div data-testid="user-app">User Portal</div>
}));

// Mock shared package
vi.mock('@foreman/shared', async () => {
  const actual = await vi.importActual('@foreman/shared');
  return {
    ...actual,
    useAuth: vi.fn(),
    useAuthStore: vi.fn(() => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    })),
    ModeProvider: ({ children }: any) => children,
    UserLayout: ({ children }: any) => <div data-testid="user-layout">{children}</div>,
    PluginRouter: () => <div data-testid="plugin-router">Plugin Router</div>,
    FOREMAN_BRANDING: {
      colors: {
        primary: '#005c7e',
        primaryGradientStart: '#0072a0',
        secondary: '#0187b6',
      }
    },
    FOREMAN_URLS: {
      website: 'https://theforeman.org',
      documentation: 'https://theforeman.org/manuals',
      community: 'https://theforeman.org/support',
    },
  };
});

// Mock pages
vi.mock('../pages/StandaloneLogin', () => ({
  StandaloneLogin: () => <div data-testid="login-page">Login Form</div>
}));

vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard-page">Dashboard</div>
}));

import { useAuth } from '@foreman/shared';

const mockUseAuth = useAuth as any;

describe('App Basic Functionality', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <AuthProvider queryClient={queryClient}>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should show loading state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: vi.fn(),
      isLoginLoading: false,
      isLogoutLoading: false,
      clearError: vi.fn(),
    });

    renderApp();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Verifying authentication')).toBeInTheDocument();
  });

  it('should show login page when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: vi.fn(),
      isLoginLoading: false,
      isLogoutLoading: false,
      clearError: vi.fn(),
    });

    renderApp();
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('user-app')).not.toBeInTheDocument();
  });

  it('should show user app when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { 
        admin: false, 
        login: 'user', 
        firstname: 'Test', 
        lastname: 'User',
        roles: [],
        organizations: [],
        locations: []
      },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: vi.fn(() => false),
      isLoginLoading: false,
      isLogoutLoading: false,
      clearError: vi.fn(),
    });

    renderApp();
    
    expect(screen.getByTestId('user-app')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});