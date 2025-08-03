import { useQuery } from '@tanstack/react-query';
import { fetchForemanStatuses, ForemanStatuses } from '../api/status';

export const useStatuses = () => {
  return useQuery<ForemanStatuses, Error>({
    queryKey: ['statuses'],
    queryFn: fetchForemanStatuses,
    staleTime: 60 * 1000, // 1 minute
    retry: 2, // Retry twice for statuses
  });
};