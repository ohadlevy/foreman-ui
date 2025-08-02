import { useAuth } from '../auth/useAuth';
import { useCurrentUser } from './useUsers';

/**
 * Hook that returns current user data, prioritizing auth store over API calls
 * This ensures we show the correct username immediately without API delays
 */
export const useCurrentUserData = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUserQuery = useCurrentUser();

  // If we have user data from auth store, use that immediately
  // This provides the correct username without waiting for API calls
  if (authUser && isAuthenticated) {
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