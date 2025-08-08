import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { SearchParams } from '../types';

export const useSmartProxies = (params?: SearchParams) => {
  const { smartproxies } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['smartproxies', params],
    queryFn: () => smartproxies.list(params),
    keepPreviousData: true,
    enabled: hasPermission('view_smart_proxies'),
  });
};

export const useSmartProxy = (id: number, enabled = true) => {
  const { smartproxies } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['smartproxies', id],
    queryFn: () => smartproxies.get(id),
    enabled: enabled && !!id && hasPermission('view_smart_proxies'),
  });
};