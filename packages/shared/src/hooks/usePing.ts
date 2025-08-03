import { useQuery } from '@tanstack/react-query';
import { fetchForemanPing, ForemanPing } from '../api/status';

export const usePing = () => {
  return useQuery<ForemanPing, Error>({
    queryKey: ['ping'],
    queryFn: fetchForemanPing,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once for ping endpoint
  });
};