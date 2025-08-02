import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { AxiosErrorResponse } from '../types';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ isInitialized: false });

interface AuthProviderProps {
  children: ReactNode;
  queryClient?: QueryClient;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const AuthContent: React.FC<Omit<AuthProviderProps, 'queryClient'>> = ({ 
  children, 
  requireAuth = false,
  requireAdmin = false 
}) => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();

  const isInitialized = !isLoading;
  

  useEffect(() => {
    if (!isInitialized) return;

    // Don't redirect if we're already on the login page
    if (window.location.pathname === '/login') return;

    // Redirect to login if authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    // Redirect to unauthorized page if admin is required but user is not admin
    if (requireAdmin && isAuthenticated && !isAdmin()) {
      console.log('Redirecting to unauthorized page');
      window.location.href = '/unauthorized';
      return;
    }
  }, [isInitialized, isAuthenticated, requireAuth, requireAdmin, user, isAdmin]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // Show unauthorized message if admin required but user is not admin
  if (requireAdmin && isAuthenticated && !isAdmin()) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column' 
      }}>
        <h1>Unauthorized</h1>
        <p>You don&apos;t have permission to access this application.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  queryClient,
  ...props 
}) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: unknown) => {
          // Don't retry on 401/403 errors
          const axiosError = error as AxiosErrorResponse;
          if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  });

  const client = queryClient || defaultQueryClient;

  return (
    <QueryClientProvider client={client}>
      <AuthContent {...props}>
        {children}
      </AuthContent>
    </QueryClientProvider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};