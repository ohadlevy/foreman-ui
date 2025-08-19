import { useQuery } from '@tanstack/react-query';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { useAuth } from '../auth/useAuth';
import { createGraphQLClient } from '../api/graphqlClient';
import { createDefaultClient } from '../api/client';
import { GET_DASHBOARD_HOST_STATS } from '../graphql/dashboard';
import { useApi } from './useApi';

interface DashboardHostStats {
  total: number;
  enabled: number;
  building: number;
}

interface GraphQLDashboardResponse {
  hosts: {
    totalCount: number;
  };
  enabledHosts: {
    totalCount: number;
  };
  buildingHosts: {
    totalCount: number;
  };
}

export const useDashboardHostStats = () => {
  const { hasPermission } = useAuth();
  const { context } = useTaxonomyStore();
  const { hosts } = useApi();
  
  return useQuery({
    queryKey: ['dashboard-host-stats', {
      orgId: context.organization?.id || null,
      locId: context.location?.id || null,
    }],
    queryFn: async (): Promise<DashboardHostStats> => {
      // Try GraphQL first
      try {
        const client = createDefaultClient();
        const graphqlClient = createGraphQLClient(client);
        
        const response = await graphqlClient.query<GraphQLDashboardResponse>(GET_DASHBOARD_HOST_STATS);
        
        if (graphqlClient.hasErrors(response)) {
          throw new Error(graphqlClient.getFormattedErrors(response));
        }
        
        // Extract counts directly from GraphQL response using proper search queries
        const total = response.data?.hosts?.totalCount || 0;
        const enabled = response.data?.enabledHosts?.totalCount || 0;
        const building = response.data?.buildingHosts?.totalCount || 0;
        
        return {
          total,
          enabled,
          building,
        };
      } catch (error) {
        console.warn('GraphQL dashboard stats failed, falling back to REST API:', error);
        
        // Fallback to REST API - use search queries to get counts efficiently
        const taxonomyParams = {
          ...(context.organization?.id && { organization_id: context.organization.id }),
          ...(context.location?.id && { location_id: context.location.id }),
        };
        
        // Get total count (use small per_page to minimize data transfer)
        const totalData = await hosts.list({ ...taxonomyParams, per_page: 1 });
        const total = totalData.total || 0;
        
        // Get enabled count using search
        const enabledData = await hosts.list({ 
          ...taxonomyParams, 
          search: 'status.enabled = true',
          per_page: 1 
        });
        const enabled = enabledData.total || 0;
        
        // Get building count using search  
        const buildingData = await hosts.list({ 
          ...taxonomyParams, 
          search: 'build = true',
          per_page: 1 
        });
        const building = buildingData.total || 0;
        
        return {
          total,
          enabled,
          building,
        };
      }
    },
    enabled: hasPermission('view_hosts'),
  });
};