import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Registration } from '../Registration';

// Mock the shared module with simple implementations
vi.mock('@foreman/shared', () => ({
  useGenerateRegistrationCommand: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  }),
  useCurrentUserData: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useRegistrationFormData: () => ({
    data: {
      hostGroups: [
        { id: 1, name: 'Test Host Group', title: 'Test Host Group' },
        { id: 2, name: 'Production', title: 'Production Environment' }
      ],
      smartProxies: [
        { id: 1, name: 'Default Smart Proxy', url: 'https://proxy.example.com' },
        { id: 2, name: 'Secondary Proxy', url: 'https://proxy2.example.com' }
      ]
    },
    isLoading: false,
    error: null,
  }),
  useAuth: () => ({
    hasPermission: () => true,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe('Registration Component', () => {
  it('should render the registration page without errors', () => {
    const { container } = render(<Registration />, { wrapper: createWrapper() });

    // Basic test to ensure component renders without crashing
    expect(container).toBeInTheDocument();
  });

  it('should render basic page elements', () => {
    render(<Registration />, { wrapper: createWrapper() });

    // Test for basic elements that should always be present
    expect(screen.getByText('Host Registration')).toBeInTheDocument();
    expect(screen.getByText('Generate a command that machines can run to register themselves with Foreman.')).toBeInTheDocument();
  });

  it('should render registration form sections', () => {
    render(<Registration />, { wrapper: createWrapper() });

    // Test that main sections are present
    expect(screen.getByText('Registration Settings')).toBeInTheDocument();
    expect(screen.getByText('Registration Command')).toBeInTheDocument();
  });

  it('should render form fields', () => {
    render(<Registration />, { wrapper: createWrapper() });

    // Test that key form elements are present
    expect(screen.getByLabelText(/Host Group/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Smart Proxy/)).toBeInTheDocument();
    // For PatternFly Switch components, look for the text content instead
    expect(screen.getByText(/Allow insecure registration/)).toBeInTheDocument();
  });

  it('should render generate command button', () => {
    render(<Registration />, { wrapper: createWrapper() });

    const generateButton = screen.getByText('Generate Registration Command');
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).toBeEnabled();
  });

  it('should populate host groups dropdown with data', () => {
    render(<Registration />, { wrapper: createWrapper() });

    const hostGroupSelect = screen.getByLabelText(/Host Group/);
    expect(hostGroupSelect).toBeInTheDocument();

    // Check that options are populated (the text content will be in the DOM)
    expect(screen.getByText('Test Host Group')).toBeInTheDocument();
    expect(screen.getByText('Production Environment')).toBeInTheDocument();
  });

  it('should populate smart proxies dropdown with data', () => {
    render(<Registration />, { wrapper: createWrapper() });

    const smartProxySelect = screen.getByLabelText(/Smart Proxy/);
    expect(smartProxySelect).toBeInTheDocument();

    // Check that options are populated (the text content will be in the DOM)
    expect(screen.getByText('Default Smart Proxy')).toBeInTheDocument();
    expect(screen.getByText('Secondary Proxy')).toBeInTheDocument();
  });
});