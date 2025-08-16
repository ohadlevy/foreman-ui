import React, { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useAuthStore } from './store';
import { createDefaultClient } from '../api/client';
import { createGlobalStateAPI } from '../api/globalState';
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
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const isCompleteRef = useRef(false);
  const isInProgressRef = useRef(false);

  // Perform token verification once at the top level
  useEffect(() => {
    const performTokenVerification = async () => {
      // Prevent duplicate verification (especially in React.StrictMode)
      if (isCompleteRef.current || isInProgressRef.current) {
        return;
      }

      const storedToken = localStorage.getItem('foreman_auth_token');

      // If no token exists, ensure we're logged out
      if (!storedToken) {
        authStore.logout();
        isCompleteRef.current = true;
        return;
      }

      // If we already have a user and are authenticated, don't re-verify
      if (authStore.isAuthenticated && authStore.user) {
        isCompleteRef.current = true;
        return;
      }

      // Set loading immediately if we have a token to prevent login page flash
      if (storedToken) {
        authStore.setLoading(true);
      }

      // Mark as in progress to prevent duplicate calls
      isInProgressRef.current = true;
      try {
        const apiClient = createDefaultClient();
        const globalStateAPI = createGlobalStateAPI(apiClient);
        
        // Use React Query to fetch and cache the global state data with fallback
        const globalState = await queryClient.fetchQuery({
          queryKey: ['globalState'],
          queryFn: async () => {
            try {
              // Try GraphQL first
              return await globalStateAPI.getGlobalState();
            } catch (error) {
              const sanitizedErrorMsg = error instanceof Error ? error.message : String(error);
              console.warn('AuthProvider: GraphQL failed, using REST fallback:', sanitizedErrorMsg);
              // Use REST fallback if GraphQL fails
              return await globalStateAPI.getGlobalStateFallback();
            }
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          cacheTime: 10 * 60 * 1000, // 10 minutes
        });
        
        authStore.login(globalState.currentUser, storedToken);
      } catch (error) {
        console.warn('Stored token verification failed, logging out:', error);
        authStore.logout();
      } finally {
        authStore.setLoading(false);
        isInProgressRef.current = false;
        isCompleteRef.current = true;
      }
    };

    performTokenVerification();
    
    // Return cleanup function to reset refs on unmount
    return () => {
      isCompleteRef.current = false;
      isInProgressRef.current = false;
    };
  }, []); // Only run once on mount

  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();

  // Only consider initialized after token verification is complete
  const isInitialized = !isLoading && isCompleteRef.current;

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