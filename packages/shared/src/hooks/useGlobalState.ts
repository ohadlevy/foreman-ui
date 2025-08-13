import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { createGlobalStateAPI, type GlobalAppState } from '../api/globalState';

/**
 * Global application state hook
 * 
 * This hook consolidates all essential app data in one optimized query:
 * - currentUser (with permissions + default org/location)
 * - organizations (full list for selectors)
 * - locations (full list for selectors)
 * 
 * Replaces multiple separate hooks/queries with one efficient GraphQL request
 */
export const useGlobalState = () => {
  const { client } = useApi();
  const globalStateAPI = createGlobalStateAPI(client);

  const query = useQuery({
    queryKey: ['globalState'],
    queryFn: async (): Promise<GlobalAppState> => {
      try {
        // Try GraphQL first for optimal performance
        return await globalStateAPI.getGlobalState();
      } catch (error) {
        console.warn('GraphQL global state query failed, falling back to REST:', error);
        // Fallback to individual REST API calls
        return await globalStateAPI.getGlobalStateFallback();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - this data doesn't change often
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  return {
    // Global state data
    globalState: query.data,
    
    // Individual data pieces for convenience
    currentUser: query.data?.currentUser,
    organizations: query.data?.organizations || [],
    locations: query.data?.locations || [],
    
    // Query state
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    
    // Helper to check if data is loaded
    isReady: !!query.data && !query.isLoading && !query.isError,
  };
};

/**
 * Hook for just the current user data from global state
 */
export const useCurrentUser = () => {
  const { currentUser, isLoading, isError, error, isReady } = useGlobalState();
  
  return {
    user: currentUser,
    isLoading,
    isError, 
    error,
    isReady
  };
};

/**
 * Hook for just the taxonomy data from global state
 */
export const useGlobalTaxonomies = () => {
  const { organizations, locations, currentUser, isLoading, isError, error, isReady } = useGlobalState();
  
  return {
    organizations,
    locations,
    // Include user's default org/location for convenience
    defaultOrganization: currentUser?.organizations?.[0],
    defaultLocation: currentUser?.locations?.[0],
    isLoading,
    isError,
    error,
    isReady
  };
};