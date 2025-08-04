import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from '../UserProfile';

// Mock the hooks
vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/usePersonalAccessTokens', () => ({
  usePersonalAccessTokens: vi.fn(),
  useRevokePersonalAccessToken: vi.fn(),
  useCurrentToken: vi.fn()
}));

import { useAuth } from '../../auth/useAuth';
import {
  usePersonalAccessTokens,
  useRevokePersonalAccessToken,
  useCurrentToken
} from '../../hooks/usePersonalAccessTokens';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUsePersonalAccessTokens = usePersonalAccessTokens as ReturnType<typeof vi.fn>;
const mockUseRevokePersonalAccessToken = useRevokePersonalAccessToken as ReturnType<typeof vi.fn>;
const mockUseCurrentToken = useCurrentToken as ReturnType<typeof vi.fn>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        mail: 'test@example.com',
        admin: false,
        organizations: [{ id: 1, name: 'Test Org' }],
        locations: [{ id: 1, name: 'Test Location' }],
      },
      logout: vi.fn()
    });

    mockUsePersonalAccessTokens.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null
    });

    mockUseRevokePersonalAccessToken.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    });

    mockUseCurrentToken.mockReturnValue({
      currentToken: null,
      currentTokenValue: 'test_token_123',
      isCurrentTokenActive: true
    });
  });

  it('should render user profile information', () => {
    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('testuser • test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test Org')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('should show admin label for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        login: 'admin',
        firstname: 'Admin',
        lastname: 'User',
        mail: 'admin@example.com',
        admin: true,
        organizations: [],
        locations: [],
      },
      logout: vi.fn()
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('should display current session information', () => {
    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    expect(screen.getByText('Current Session')).toBeInTheDocument();
    expect(screen.getByText('Logout Current Session')).toBeInTheDocument();
    // Token is no longer displayed for security
  });

  it('should display personal access tokens', () => {
    const mockTokens = [
      {
        id: 1,
        name: 'Foreman UI - 2025-08-01',
        'active?': true,
        active: true,
        created_at: '2025-08-01T10:00:00Z',
        last_used_at: '2025-08-01T12:00:00Z',
        expires_at: null,
        user_id: 1,
        updated_at: '2025-08-01T10:00:00Z',
        'revoked?': false
      },
      {
        id: 2,
        name: 'API Token',
        'active?': false,
        active: false,
        created_at: '2025-07-15T10:00:00Z',
        last_used_at: null,
        expires_at: '2025-12-31T23:59:59Z',
        user_id: 1,
        updated_at: '2025-07-15T10:00:00Z',
        'revoked?': true
      }
    ];

    mockUsePersonalAccessTokens.mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null
    });

    mockUseCurrentToken.mockReturnValue({
      currentToken: mockTokens[0],
      currentTokenValue: 'test_token_123',
      isCurrentTokenActive: true
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    expect(screen.getByText('Foreman UI - 2025-08-01')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    // Inactive token should not be shown by default
    expect(screen.queryByText('API Token')).not.toBeInTheDocument();
  });

  it('should handle logout when current session logout button is clicked', async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        login: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        mail: 'test@example.com',
        admin: false,
        organizations: [],
        locations: [],
      },
      logout: mockLogout
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    const logoutButton = screen.getByText('Logout Current Session');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should handle token revocation', async () => {
    const mockRevoke = vi.fn();
    const mockTokens = [
      {
        id: 1,
        name: 'Test Token',
        'active?': true,
        active: true,
        created_at: '2025-08-01T10:00:00Z',
        last_used_at: null,
        expires_at: null,
        user_id: 1,
        updated_at: '2025-08-01T10:00:00Z',
        'revoked?': false
      }
    ];

    mockUsePersonalAccessTokens.mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null
    });

    mockUseRevokePersonalAccessToken.mockReturnValue({
      mutateAsync: mockRevoke,
      isPending: false
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    const revokeButton = screen.getByText('Revoke');
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(mockRevoke).toHaveBeenCalledWith(1);
    });
  });

  it('should show loading state', () => {
    mockUsePersonalAccessTokens.mockReturnValue({
      tokens: [],
      isLoading: true,
      error: null
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    expect(screen.getByText('Loading tokens...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUsePersonalAccessTokens.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: new Error('Failed to fetch')
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    expect(screen.getByText('Error loading tokens')).toBeInTheDocument();
  });

  it('should toggle showing inactive tokens', () => {
    const mockTokens = [
      {
        id: 1,
        name: 'Active Token',
        'active?': true,
        active: true,
        created_at: '2025-08-01T10:00:00Z',
        last_used_at: null,
        expires_at: null,
        user_id: 1,
        updated_at: '2025-08-01T10:00:00Z',
        'revoked?': false
      },
      {
        id: 2,
        name: 'Inactive Token',
        'active?': false,
        active: false,
        created_at: '2025-07-15T10:00:00Z',
        last_used_at: null,
        expires_at: null,
        user_id: 1,
        updated_at: '2025-07-15T10:00:00Z',
        'revoked?': true
      }
    ];

    mockUsePersonalAccessTokens.mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null
    });

    mockUseCurrentToken.mockReturnValue({
      currentToken: mockTokens[0],
      currentTokenValue: 'test_token_123',
      isCurrentTokenActive: true
    });

    const wrapper = createWrapper();
    render(<UserProfile />, { wrapper });

    // Initially, inactive token should not be shown
    expect(screen.getByText('Active Token')).toBeInTheDocument();
    expect(screen.queryByText('Inactive Token')).not.toBeInTheDocument();

    // Toggle to show inactive tokens
    const toggle = screen.getByLabelText('Show inactive tokens');
    fireEvent.click(toggle);

    // Now inactive token should be visible
    expect(screen.getByText('Active Token')).toBeInTheDocument();
    expect(screen.getByText('Inactive Token')).toBeInTheDocument();
  });

  it('should not render if no user is provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn()
    });

    const wrapper = createWrapper();
    const { container } = render(<UserProfile />, { wrapper });

    expect(container.firstChild).toBeNull();
  });
});