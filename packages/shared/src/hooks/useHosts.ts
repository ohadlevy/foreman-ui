import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { HostSearchParams, HostFormData } from '../types';
import { useTaxonomyStore } from '../stores/taxonomyStore';

export const useHosts = (params?: HostSearchParams) => {
  const { hosts } = useApi();
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
    queryKey: ['hosts', params, taxonomyContext],
    queryFn: () => hosts.list(enhancedParams),
    keepPreviousData: true,
    enabled: hasPermission('view_hosts'),
  });
};

export const useHost = (id: number, enabled = true) => {
  const { hosts } = useApi();
  const { hasPermission } = useAuth();
  const { context } = useTaxonomyStore();

  // Include taxonomy context in query key to ensure proper cache separation
  const taxonomyContext = {
    orgId: context.organization?.id || null,
    locId: context.location?.id || null,
  };

  return useQuery({
    queryKey: ['hosts', id, taxonomyContext],
    queryFn: () => hosts.get(id),
    enabled: enabled && !!id && hasPermission('view_hosts'),
  });
};



export const useCreateHost = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HostFormData) => hosts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
};

export const useUpdateHost = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HostFormData> }) =>
      hosts.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['hosts', id] });
    },
  });
};

export const useDeleteHost = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hosts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
};

export const useHostPower = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'start' | 'stop' | 'restart' | 'reset' }) =>
      hosts.power(id, action),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['hosts', id] });
    },
  });
};

export const useHostBuild = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hosts.build(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hosts', id] });
    },
  });
};

export const useCancelHostBuild = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hosts.cancelBuild(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['hosts', id] });
    },
  });
};