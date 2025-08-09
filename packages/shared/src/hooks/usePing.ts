import { useQuery } from '@tanstack/react-query';
import { fetchForemanPing, ForemanPingResponse } from '../api/status';

export const usePing = () => {
  return useQuery<ForemanPingResponse, Error>({
    queryKey: ['ping'],
    queryFn: fetchForemanPing,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once for ping endpoint
  });
};