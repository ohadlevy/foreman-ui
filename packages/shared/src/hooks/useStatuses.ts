import { useQuery } from '@tanstack/react-query';
import { fetchForemanStatuses, ForemanStatusesResponse } from '../api/status';

export const useStatuses = () => {
  return useQuery<ForemanStatusesResponse, Error>({
    queryKey: ['statuses'],
    queryFn: fetchForemanStatuses,
    staleTime: 60 * 1000, // 1 minute
    retry: 2, // Retry twice for statuses
  });
};