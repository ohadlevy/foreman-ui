import { useQuery } from '@tanstack/react-query';
import { createDefaultClient } from '../api/client';
import { UserContextAPI } from '../api/userContext';

/**
 * Hook to fetch comprehensive user context data including organizations and locations
 * This provides all the data needed for taxonomy context switching
 */
export const useUserContext = () => {
  const apiClient = createDefaultClient();
  const userContextAPI = new UserContextAPI(apiClient);

  return useQuery({
    queryKey: ['userContext'],
    queryFn: () => userContextAPI.getUserContext(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};