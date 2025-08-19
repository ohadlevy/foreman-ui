import { useQuery } from '@tanstack/react-query';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { useAuth } from '../auth/useAuth';
import { createGraphQLClient } from '../api/graphqlClient';
import { createDefaultClient } from '../api/client';
import { GET_HOSTS_LIST, GET_BULK_OPERATION_TARGETS } from '../graphql/hostsList';
import { Host, HostSearchParams } from '../types';

interface ExtendedHostSearchParams extends HostSearchParams {
  afterCursor?: string;
}

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
  build: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
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
}

// Convert GraphQL response to REST API format for compatibility
const convertGraphQLToHost = (gqlHost: GraphQLHost): Host => {
  return {
    id: parseInt(gqlHost.id, 10),
    name: gqlHost.name,
    ip: gqlHost.ip,
    build: gqlHost.build,
    managed: true, // Default assumption for GraphQL hosts
    enabled: gqlHost.enabled,
    created_at: gqlHost.createdAt,
    updated_at: gqlHost.updatedAt ?? gqlHost.createdAt,
    last_report: gqlHost.lastReport,
    capabilities: [], // Default empty array
    
    // Convert related entities (only names available from GraphQL)
    operatingsystem_name: gqlHost.operatingsystem?.name,
    hostgroup_name: gqlHost.hostgroup?.name,
    organization_name: gqlHost.organization?.name,
    location_name: gqlHost.location?.name,
    owner_name: gqlHost.owner?.name,
  };
};

export const useHostsGraphQL = (params?: ExtendedHostSearchParams) => {
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
        first: params?.per_page ?? 20,
        // Accept server-provided cursor from params - don't synthesize cursors
        after: params?.afterCursor ?? null,
        search: params?.search ?? null,
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
        // Expose GraphQL pagination info for proper cursor-based pagination
        pageInfo: hostsData?.pageInfo,
        nextCursor: hostsData?.pageInfo?.endCursor,
        hasNextPage: hostsData?.pageInfo?.hasNextPage,
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