import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { HostSearchParams, HostFormData } from '../types';

export const useHosts = (params?: HostSearchParams) => {
  const { hosts } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['hosts', params],
    queryFn: () => hosts.list(params),
    keepPreviousData: true,
    enabled: hasPermission('view_hosts'),
  });
};

export const useHost = (id: number, enabled = true) => {
  const { hosts } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['hosts', id],
    queryFn: () => hosts.get(id),
    enabled: enabled && !!id && hasPermission('view_hosts'),
  });
};

export const useMyHosts = (params?: HostSearchParams) => {
  const { hosts } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['myHosts', params],
    queryFn: () => hosts.getMyHosts(params),
    keepPreviousData: true,
    enabled: hasPermission('view_hosts'),
  });
};

export const useCreateHost = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HostFormData) => hosts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
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
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
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
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
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


export const useBulkDeleteHosts = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hostIds: number[]) => hosts.bulkDelete(hostIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useBulkUpdateHostGroup = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostIds, hostgroupId }: { hostIds: number[]; hostgroupId: number }) =>
      hosts.bulkUpdateHostGroup(hostIds, hostgroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useBulkUpdateOrganization = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostIds, organizationId }: { hostIds: number[]; organizationId: number }) =>
      hosts.bulkUpdateOrganization(hostIds, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useBulkUpdateLocation = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostIds, locationId }: { hostIds: number[]; locationId: number }) =>
      hosts.bulkUpdateLocation(hostIds, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useBulkBuild = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostIds, options }: { hostIds: number[]; options?: { reboot?: boolean; rebuildConfiguration?: boolean } }) =>
      hosts.bulkBuild(hostIds, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useBulkChangeOwner = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostIds, ownerId }: { hostIds: number[]; ownerId: number }) =>
      hosts.bulkChangeOwner(hostIds, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useBulkDisassociate = () => {
  const { hosts } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hostIds: number[]) =>
      hosts.bulkDisassociate(hostIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      queryClient.invalidateQueries({ queryKey: ['myHosts'] });
    },
  });
};

export const useAllHostIds = (searchParams?: { search?: string }) => {
  const { hosts } = useApi();

  return useQuery({
    queryKey: ['allHostIds', searchParams?.search || ''],
    queryFn: async () => {
      try {
        return await hosts.getAllHostIdsGraphQL(searchParams || {});
      } catch (error) {
        // Ensure GraphQL errors don't break the query system
        console.warn('GraphQL getAllHostIds failed:', error);
        // Return empty array as fallback - this prevents query from failing
        return [];
      }
    },
    enabled: false, // Only run when manually triggered
    staleTime: 30000, // Cache for 30 seconds
    retry: false, // Don't retry failed GraphQL queries
  });
};

