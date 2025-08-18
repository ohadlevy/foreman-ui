import { useQuery } from '@tanstack/react-query';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { useAuth } from '../auth/useAuth';
import { createGraphQLClient } from '../api/graphqlClient';
import { createDefaultClient } from '../api/client';
import { GET_HOSTS_LIST, GET_BULK_OPERATION_TARGETS } from '../graphql/hostsList';
import { Host, HostSearchParams } from '../types';

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
      node: GraphQLHost;
    }>;
  };
}

interface GraphQLHost {
  id: string;
  name: string;
  ip?: string;
  mac?: string;
  build: boolean;
  managed: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastReport?: string;
  globalStatus?: string;
  operatingSystem?: {
    id: string;
    name: string;
  };
  hostgroup?: {
    id: string;
    name: string;
  };
  environment?: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
    type: string;
  };
  domain?: {
    id: string;
    name: string;
  };
}

// Convert GraphQL response to REST API format for compatibility
const convertGraphQLToHost = (gqlHost: GraphQLHost): Host => {
  return {
    id: parseInt(gqlHost.id, 10),
    name: gqlHost.name,
    ip: gqlHost.ip,
    mac: gqlHost.mac,
    build: gqlHost.build,
    managed: gqlHost.managed,
    enabled: gqlHost.enabled,
    created_at: gqlHost.createdAt,
    updated_at: gqlHost.updatedAt,
    last_report: gqlHost.lastReport,
    capabilities: [], // Default empty array
    
    // Convert related entities
    operatingsystem_id: gqlHost.operatingSystem ? parseInt(gqlHost.operatingSystem.id, 10) : undefined,
    operatingsystem_name: gqlHost.operatingSystem?.name,
    
    hostgroup_id: gqlHost.hostgroup ? parseInt(gqlHost.hostgroup.id, 10) : undefined,
    hostgroup_name: gqlHost.hostgroup?.name,
    
    environment_id: gqlHost.environment ? parseInt(gqlHost.environment.id, 10) : undefined,
    environment_name: gqlHost.environment?.name,
    
    organization_id: gqlHost.organization ? parseInt(gqlHost.organization.id, 10) : undefined,
    organization_name: gqlHost.organization?.name,
    
    location_id: gqlHost.location ? parseInt(gqlHost.location.id, 10) : undefined,
    location_name: gqlHost.location?.name,
    
    owner_id: gqlHost.owner ? parseInt(gqlHost.owner.id, 10) : undefined,
    owner_name: gqlHost.owner?.name,
    owner_type: gqlHost.owner?.type,
    
    domain_id: gqlHost.domain ? parseInt(gqlHost.domain.id, 10) : undefined,
    domain_name: gqlHost.domain?.name,
  };
};

export const useHostsGraphQL = (params?: HostSearchParams) => {
  const { hasPermission } = useAuth();
  const { context } = useTaxonomyStore();

  // Include taxonomy context in query key to ensure proper cache separation
  const taxonomyContext = {
    orgId: context.organization?.id || null,
    locId: context.location?.id || null,
  };

  return useQuery({
    queryKey: ['hosts-graphql', params, taxonomyContext],
    queryFn: async () => {
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
      const hosts = hostsData?.edges?.map((edge: { node: GraphQLHost }) => 
        convertGraphQLToHost(edge.node)
      ) || [];
      
      // Return data in REST API format for compatibility
      return {
        total: hostsData?.totalCount || 0,
        subtotal: hostsData?.totalCount || 0,
        page: params?.page || 1,
        per_page: params?.per_page || 20,
        search: params?.search || '',
        sort: {
          by: 'name',
          order: 'ASC'
        },
        results: hosts,
      };
    },
    keepPreviousData: true,
    enabled: hasPermission('view_hosts'),
  });
};

// Hook for bulk operation targets (loaded on-demand)
export const useBulkOperationTargets = (enabled: boolean = false) => {
  const { hasPermission } = useAuth();
  
  return useQuery({
    queryKey: ['bulk-operation-targets'],
    queryFn: async () => {
      const client = createDefaultClient();
      const graphqlClient = createGraphQLClient(client);
      
      const response = await graphqlClient.query(GET_BULK_OPERATION_TARGETS);
      
      if (graphqlClient.hasErrors(response)) {
        throw new Error(graphqlClient.getFormattedErrors(response));
      }
      
      return response.data;
    },
    enabled: enabled && hasPermission('edit_hosts'),
    // Only fetch when explicitly requested
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};