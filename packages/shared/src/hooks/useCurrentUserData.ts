import { useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { useCurrentUser } from './useUsers';
import { useAuthStore } from '../auth/store';

/**
 * Hook that returns current user data, prioritizing auth store over API calls
 * This ensures we show the correct username immediately without API delays
 */
export const useCurrentUserData = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUserQuery = useCurrentUser();
  const { setUser } = useAuthStore();

  // Update auth store when API returns fresh user data with permissions
  useEffect(() => {
    if (currentUserQuery.data && currentUserQuery.isSuccess) {
      setUser(currentUserQuery.data);
    }
  }, [currentUserQuery.data, currentUserQuery.isSuccess, setUser]);

  // If we have user data from auth store, use that immediately
  // This provides the correct username without waiting for API calls
  if (authUser && isAuthenticated) {
    // If we also have fresh API data, prefer that for permissions
    if (currentUserQuery.data && currentUserQuery.isSuccess) {
      return {
        data: currentUserQuery.data,
        isLoading: currentUserQuery.isLoading,
        error: currentUserQuery.error,
        isSuccess: currentUserQuery.isSuccess,
      };
    }
    
    return {
      data: authUser,
      isLoading: false,
      error: null,
      isSuccess: true,
    };
  }

  // Fall back to the API query if no auth user data
  return {
    data: currentUserQuery.data,
    isLoading: currentUserQuery.isLoading,
    error: currentUserQuery.error,
    isSuccess: currentUserQuery.isSuccess,
  };
};