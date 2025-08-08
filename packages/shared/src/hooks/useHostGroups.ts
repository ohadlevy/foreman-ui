import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { SearchParams } from '../types';

export const useHostGroups = (params?: SearchParams) => {
  const { hostgroups } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['hostgroups', params],
    queryFn: () => hostgroups.list(params),
    keepPreviousData: true,
    enabled: hasPermission('view_hostgroups'),
  });
};

export const useHostGroup = (id: number, enabled = true) => {
  const { hostgroups } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['hostgroups', id],
    queryFn: () => hostgroups.get(id),
    enabled: enabled && !!id && hasPermission('view_hostgroups'),
  });
};