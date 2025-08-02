import { useQuery } from '@tanstack/react-query';
import { fetchForemanStatus, ForemanStatus } from '../api/status';

export const useStatus = () => {
  return useQuery<ForemanStatus, Error>({
    queryKey: ['status'],
    queryFn: fetchForemanStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for status endpoint
  });
};