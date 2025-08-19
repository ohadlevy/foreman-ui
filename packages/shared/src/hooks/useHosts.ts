import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { HostSearchParams, HostFormData, Host } from '../types';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { createGraphQLClient } from '../api/graphqlClient';
import { createDefaultClient } from '../api/client';
import { GET_HOSTS_LIST } from '../graphql/hostsList';

interface GraphQLHostsResponse {
  hosts: {
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
    edges: Array<{
      node: {
        id: string;
        name: string;
        ip?: string;
        build: boolean;
        enabled: boolean;
        createdAt: string;
        updatedAt?: string;
        lastReport?: string;
        operatingsystem?: {
          name: string;
        };
        hostgroup?: {
          name: string;
        };
        organization?: {
          name: string;
        };
        location?: {
          name: string;
        };
        owner?: {
          name: string;
        };
      };
    }>;
  };
}

export const useHosts = (params?: HostSearchParams) => {
  const { hosts } = useApi();
  const { hasPermission } = useAuth();
  const { context } = useTaxonomyStore();

  // Include taxonomy context in query key to ensure proper cache separation
  const taxonomyContext = {
    orgId: context.organization?.id || null,
    locId: context.location?.id || null,
  };

  return useQuery({
    queryKey: ['hosts', params, taxonomyContext],
    queryFn: async () => {
      // Try GraphQL first
      try {
        const client = createDefaultClient();
        const graphqlClient = createGraphQLClient(client);
        
        const response = await graphqlClient.query<GraphQLHostsResponse>(GET_HOSTS_LIST, {
          first: params?.per_page || 20,
          after: params?.page && params.page > 1 ? btoa(`cursor:${(params.page - 1) * (params?.per_page || 20)}`) : null,
          search: params?.search || null,
        });
        
        if (graphqlClient.hasErrors(response)) {
          throw new Error(graphqlClient.getFormattedErrors(response));
        }
        
        const hostsData = response.data?.hosts;
        const graphqlHosts: Host[] = hostsData?.edges?.map((edge) => ({
          id: parseInt(edge.node.id, 10),
          name: edge.node.name,
          ip: edge.node.ip,
          build: edge.node.build,
          enabled: edge.node.enabled,
          managed: true, // Default assumption for GraphQL hosts
          created_at: edge.node.createdAt,
          updated_at: edge.node.updatedAt ?? edge.node.createdAt,
          last_report: edge.node.lastReport,
          capabilities: [],
          // Only include the name fields that are actually displayed
          operatingsystem_name: edge.node.operatingsystem?.name,
          hostgroup_name: edge.node.hostgroup?.name,
          environment_name: undefined, // Not available in GraphQL schema
          organization_name: edge.node.organization?.name,
          location_name: edge.node.location?.name,
          owner_name: edge.node.owner?.name,
        })) || [];
        
        return {
          total: hostsData?.totalCount || 0,
          subtotal: hostsData?.totalCount || 0,
          page: params?.page || 1,
          per_page: params?.per_page || 20,
          search: params?.search || '',
          sort: { by: 'name', order: 'ASC' },
          results: graphqlHosts,
        };
      } catch (error) {
        console.warn('GraphQL hosts query failed, falling back to REST API:', error);
        
        // Fallback to REST API
        const enhancedParams = {
          ...params,
          ...(context.organization?.id && { organization_id: context.organization.id }),
          ...(context.location?.id && { location_id: context.location.id }),
        };
        
        return hosts.list(enhancedParams);
      }
    },
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