import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { SearchParams } from '../types';
import { useTaxonomyStore } from '../stores/taxonomyStore';

export const useHostGroups = (params?: SearchParams) => {
  const { hostgroups } = useApi();
  const { hasPermission } = useAuth();
  const { context } = useTaxonomyStore();

  // Include taxonomy context in query key to ensure proper cache separation
  const taxonomyContext = {
    orgId: context.organization?.id || null,
    locId: context.location?.id || null,
  };

  // Merge taxonomy context into API parameters
  const enhancedParams = {
    ...params,
    ...(context.organization?.id && { organization_id: context.organization.id }),
    ...(context.location?.id && { location_id: context.location.id }),
  };

  return useQuery({
    queryKey: ['hostgroups', params, taxonomyContext],
    queryFn: () => hostgroups.list(enhancedParams),
    keepPreviousData: true,
    enabled: hasPermission('view_hostgroups'),
  });
};

export const useHostGroup = (id: number, enabled = true) => {
  const { hostgroups } = useApi();
  const { hasPermission } = useAuth();
  const { context } = useTaxonomyStore();

  // Include taxonomy context in query key to ensure proper cache separation
  const taxonomyContext = {
    orgId: context.organization?.id || null,
    locId: context.location?.id || null,
  };

  return useQuery({
    queryKey: ['hostgroups', id, taxonomyContext],
    queryFn: () => hostgroups.get(id),
    enabled: enabled && !!id && hasPermission('view_hostgroups'),
  });
};