import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SimpleLogin } from '../SimpleLogin';
import type { User, AuthResponse, LoginCredentials } from '@foreman/shared';

// Mock the shared module
vi.mock('@foreman/shared', () => ({
  useAuth: vi.fn(),
  LoginForm: vi.fn(({ onSubmit, isLoading, error }) => (
    <form
      data-testid="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        onSubmit({
          login: formData.get('login') as string,
          password: formData.get('password') as string,
        });
      }}
    >
      <input name="login" data-testid="login-input" />
      <input name="password" type="password" data-testid="password-input" />
      <button type="submit" disabled={isLoading} data-testid="submit-button">
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  )),
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
    community: 'https://community.theforeman.org',
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual || {}),
    useNavigate: () => mockNavigate,
  };
});

describe('SimpleLogin', () => {
  let mockUseAuth: {
    user: null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: ReturnType<typeof vi.fn>;
    loginWithToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    clearError: ReturnType<typeof vi.fn>;
    hasPermission: ReturnType<typeof vi.fn>;
    isAdmin: () => boolean;
    isLoginLoading: boolean;
    isLogoutLoading: boolean;
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(async () => {
    mockUseAuth = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn<[LoginCredentials], Promise<AuthResponse>>().mockResolvedValue({
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
      }),
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
      logout: vi.fn(),
      clearError: vi.fn(),
      hasPermission: vi.fn(),
      isAdmin: () => false,
      isLoginLoading: false,
      isLogoutLoading: false,
    };

    const { useAuth } = vi.mocked(await import('@foreman/shared'));
    useAuth.mockReturnValue(mockUseAuth as ReturnType<typeof import('@foreman/shared').useAuth>);

    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render login page with logo and form', () => {
      renderWithRouter(<SimpleLogin />);

      // Check for Foreman logo
      expect(screen.getByAltText('Foreman')).toBeInTheDocument();
      expect(screen.getByAltText('Foreman')).toHaveAttribute('src', '/assets/foreman-logo.svg');

      // Check for title and description
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByText('Enter your Foreman credentials')).toBeInTheDocument();

      // Check for login form
      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      // Check for footer message
      expect(screen.getByText('Need an account? Contact your system administrator.')).toBeInTheDocument();

      // Check for footer links
      expect(screen.getByText('About Foreman')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Need help?')).toBeInTheDocument();
    });

    it('should render with proper styling and branding', () => {
      renderWithRouter(<SimpleLogin />);

      const logo = screen.getByAltText('Foreman');
      expect(logo).toHaveStyle({ height: '80px' });
    });

    it('should render footer links with correct URLs', () => {
      renderWithRouter(<SimpleLogin />);

      const aboutLink = screen.getByText('About Foreman').closest('a');
      const docLink = screen.getByText('Documentation').closest('a');
      const helpLink = screen.getByText('Need help?').closest('a');

      expect(aboutLink).toHaveAttribute('href', 'https://theforeman.org');
      expect(docLink).toHaveAttribute('href', 'https://theforeman.org/manuals');
      expect(helpLink).toHaveAttribute('href', 'https://community.theforeman.org');

      // Check that links open in new tab
      expect(aboutLink).toHaveAttribute('target', '_blank');
      expect(docLink).toHaveAttribute('target', '_blank');
      expect(helpLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('login functionality', () => {
    it('should call login function with correct credentials', async () => {
      const user = userEvent.setup();
      mockUseAuth.login.mockResolvedValue(undefined);

      renderWithRouter(<SimpleLogin />);

      // Fill in the form
      await user.type(screen.getByTestId('login-input'), 'ohad');
      await user.type(screen.getByTestId('password-input'), 'secret');

      // Submit the form
      await user.click(screen.getByTestId('submit-button'));

      expect(mockUseAuth.login).toHaveBeenCalledWith({
        login: 'ohad',
        password: 'secret',
      });
    });

    it('should navigate to dashboard after successful login', async () => {
      const user = userEvent.setup();
      mockUseAuth.login.mockResolvedValue(undefined);

      renderWithRouter(<SimpleLogin />);

      // Fill in the form
      await user.type(screen.getByTestId('login-input'), 'ohad');
      await user.type(screen.getByTestId('password-input'), 'secret');

      // Submit the form
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      mockUseAuth.login.mockRejectedValue(new Error(errorMessage));

      renderWithRouter(<SimpleLogin />);

      // Fill in the form
      await user.type(screen.getByTestId('login-input'), 'invalid');
      await user.type(screen.getByTestId('password-input'), 'wrong');

      // Submit the form
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith({
          login: 'invalid',
          password: 'wrong',
        });
      });

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during login', () => {
      mockUseAuth.isLoginLoading = true;

      renderWithRouter(<SimpleLogin />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('Logging in...');
      expect(submitButton).toBeDisabled();
    });

    it('should display error message when login fails', () => {
      mockUseAuth.error = 'Invalid username or password';

      renderWithRouter(<SimpleLogin />);

      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid username or password');
    });
  });

  describe('form validation', () => {
    it('should handle empty form submission', async () => {
      const user = userEvent.setup();
      mockUseAuth.login.mockResolvedValue(undefined);

      renderWithRouter(<SimpleLogin />);

      // Submit empty form
      await user.click(screen.getByTestId('submit-button'));

      expect(mockUseAuth.login).toHaveBeenCalledWith({
        login: '',
        password: '',
      });
    });

    it('should handle form submission with only username', async () => {
      const user = userEvent.setup();
      mockUseAuth.login.mockResolvedValue(undefined);

      renderWithRouter(<SimpleLogin />);

      await user.type(screen.getByTestId('login-input'), 'testuser');
      await user.click(screen.getByTestId('submit-button'));

      expect(mockUseAuth.login).toHaveBeenCalledWith({
        login: 'testuser',
        password: '',
      });
    });

    it('should handle form submission with only password', async () => {
      const user = userEvent.setup();
      mockUseAuth.login.mockResolvedValue(undefined);

      renderWithRouter(<SimpleLogin />);

      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('submit-button'));

      expect(mockUseAuth.login).toHaveBeenCalledWith({
        login: '',
        password: 'password123',
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<SimpleLogin />);

      const heading = screen.getByRole('heading', { name: 'Sign in to your account' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('should have accessible links', () => {
      renderWithRouter(<SimpleLogin />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);

      links.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should have proper alt text for logo', () => {
      renderWithRouter(<SimpleLogin />);

      const logo = screen.getByAltText('Foreman');
      expect(logo).toBeInTheDocument();
    });
  });
});