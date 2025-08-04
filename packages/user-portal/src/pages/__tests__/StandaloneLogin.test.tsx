import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StandaloneLogin } from '../StandaloneLogin';

// Mock the shared package
vi.mock('@foreman/shared', () => ({
  FOREMAN_BRANDING: {
    colors: {
      primary: '#0066CC',
      primaryGradientStart: '#0066CC',
      secondary: '#004499',
    },
  },
  FOREMAN_URLS: {
    website: 'https://theforeman.org',
    documentation: 'https://theforeman.org/manuals',
    community: 'https://theforeman.org/support',
  },
  createDefaultClient: vi.fn(),
  AuthAPI: vi.fn(),
  useAuthStore: vi.fn(),
}));

import { createDefaultClient, AuthAPI, useAuthStore } from '@foreman/shared';

const mockCreateDefaultClient = createDefaultClient as any;
const mockAuthAPI = AuthAPI as any;
const mockUseAuthStore = useAuthStore as any;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StandaloneLogin', () => {
  const mockLogin = vi.fn();
  const mockAuthInstance = {
    login: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
    } as any);

    mockCreateDefaultClient.mockReturnValue({} as any);
    mockAuthAPI.mockReturnValue(mockAuthInstance as any);
  });

  const renderStandaloneLogin = () => {
    return render(
      <BrowserRouter>
        <StandaloneLogin />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render login form elements', () => {
      renderStandaloneLogin();

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('should render branding elements', () => {
      renderStandaloneLogin();

      expect(screen.getByAltText('Foreman')).toBeInTheDocument();
      expect(screen.getByText('Enter your Foreman credentials')).toBeInTheDocument();
    });

    it('should render footer links', () => {
      renderStandaloneLogin();

      expect(screen.getByText('About Foreman')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Need help?')).toBeInTheDocument();
    });

    it('should render password visibility toggle', () => {
      renderStandaloneLogin();

      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button', { name: 'Show password' });

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update input values when typing', () => {
      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });

      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('testpass');
    });

    it('should toggle password visibility', () => {
      renderStandaloneLogin();

      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button', { name: 'Show password' });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should show validation error for empty fields', async () => {
      renderStandaloneLogin();

      const submitButton = screen.getByRole('button', { name: 'Sign in' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      });
    });

    it('should show validation error for empty username', async () => {
      renderStandaloneLogin();

      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      });
    });

    it('should show validation error for empty password', async () => {
      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should call auth API on successful form submission', async () => {
      const mockResponse = {
        user: { id: 1, login: 'testuser', admin: false },
        token: 'test-token',
      };
      
      mockAuthInstance.login.mockResolvedValue(mockResponse);

      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthInstance.login).toHaveBeenCalledWith({
          login: 'testuser',
          password: 'testpass',
        });
      });

      expect(mockLogin).toHaveBeenCalledWith(mockResponse.user, mockResponse.token);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should show loading state during authentication', async () => {
      mockAuthInstance.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              message: 'Invalid credentials',
            },
          },
        },
      };

      mockAuthInstance.login.mockRejectedValue(errorResponse);

      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle generic errors', async () => {
      mockAuthInstance.login.mockRejectedValue(new Error('Network error'));

      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle errors without message', async () => {
      mockAuthInstance.login.mockRejectedValue({});

      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');

      expect(usernameInput).toHaveAttribute('id', 'login');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(usernameInput).toHaveAttribute('autoComplete', 'username');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    it('should support keyboard navigation', () => {
      renderStandaloneLogin();

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign in' });

      usernameInput.focus();
      expect(document.activeElement).toBe(usernameInput);

      fireEvent.keyDown(usernameInput, { key: 'Tab' });
      passwordInput.focus();
      expect(document.activeElement).toBe(passwordInput);

      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });
  });
});