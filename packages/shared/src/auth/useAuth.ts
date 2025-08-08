import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './store';
import { createDefaultClient, resetDefaultClient } from '../api/client';
import { AuthAPI } from '../api/auth';
import { LoginCredentials, AxiosErrorResponse } from '../types';

export const useAuth = () => {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();

  // Create API client
  const apiClient = createDefaultClient();
  const authAPI = new AuthAPI(apiClient);

  // Token verification moved to AuthProvider to prevent duplicate calls and React.StrictMode issues

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authAPI.login(credentials),
    onMutate: () => {
      authStore.setLoading(true);
      authStore.clearError();
    },
    onSuccess: (response) => {
      authStore.login(response.user, response.token);
      // Login successful - user and token stored in auth store
    },
    onError: (error: unknown) => {
      console.error('Login error:', error);
      const axiosError = error as AxiosErrorResponse;
      const message = axiosError?.response?.data?.error?.message || axiosError?.message || 'Login failed';
      authStore.setError(message);
      authStore.setLoading(false);
    },
  });

  // Token login mutation (for Personal Access Tokens)
  const tokenLoginMutation = useMutation({
    mutationFn: (token: string) => authAPI.loginWithToken(token),
    onMutate: () => {
      authStore.setLoading(true);
      authStore.clearError();
    },
    onSuccess: (user, token) => {
      authStore.login(user, token);
      // Token login successful - user and token stored in auth store
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosErrorResponse;
      const message = axiosError?.response?.data?.error?.message || 'Token authentication failed';
      authStore.setError(message);
      authStore.setLoading(false);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Clear auth state after successful token revocation
      authStore.logout();
      queryClient.clear();
      // CRITICAL: Reset the API client singleton to prevent token reuse
      resetDefaultClient();
    },
    onError: () => {
      // Even if server logout fails, clear local state for security
      authStore.logout();
      queryClient.clear();
      // CRITICAL: Reset the API client singleton to prevent token reuse
      resetDefaultClient();
    },
  });

  // Note: Token verification moved to AuthProvider to run only once on app startup


  // Removed redundant current user query to prevent auth bypass issues

  const login = useCallback((credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const loginWithToken = useCallback((token: string) => {
    return tokenLoginMutation.mutateAsync(token);
  }, [tokenLoginMutation]);

  const logout = useCallback(() => {
    // Start logout process - token revocation happens first, state clearing after
    logoutMutation.mutate();
  }, [logoutMutation]);

  // Calculate loading state from auth store only
  const isLoadingCalculated = authStore.isLoading;


  return {
    // State
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: isLoadingCalculated,
    error: authStore.error,

    // Actions
    login,
    loginWithToken,
    logout,
    clearError: authStore.clearError,

    // Permission helpers
    hasPermission: authStore.hasPermission,
    isAdmin: authStore.isAdmin,

    // Mutation states
    isLoginLoading: loginMutation.isPending || tokenLoginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
};