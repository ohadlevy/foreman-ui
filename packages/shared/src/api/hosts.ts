import { ForemanAPIClient } from './client';
import { Host, HostSearchParams, HostFormData, ApiResponse, BulkOperationResult } from '../types';
import { API_ENDPOINTS } from '../constants';

export class HostsAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: HostSearchParams): Promise<ApiResponse<Host>> {
    return this.client.getPaginated<Host>(API_ENDPOINTS.HOSTS, params);
  }

  async get(id: number): Promise<Host> {
    return this.client.get<Host>(`${API_ENDPOINTS.HOSTS}/${id}`);
  }

  async create(data: HostFormData): Promise<Host> {
    return this.client.post<Host>(API_ENDPOINTS.HOSTS, { host: data });
  }

  async update(id: number, data: Partial<HostFormData>): Promise<Host> {
    return this.client.put<Host>(`${API_ENDPOINTS.HOSTS}/${id}`, { host: data });
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`${API_ENDPOINTS.HOSTS}/${id}`);
  }

  async power(id: number, action: 'start' | 'stop' | 'restart' | 'reset'): Promise<void> {
    return this.client.put(`${API_ENDPOINTS.HOSTS}/${id}/power`, { power_action: action });
  }

  async build(id: number): Promise<void> {
    return this.client.put(`${API_ENDPOINTS.HOSTS}/${id}/setBuild`);
  }

  async cancelBuild(id: number): Promise<void> {
    return this.client.put(`${API_ENDPOINTS.HOSTS}/${id}/cancelBuild`);
  }

  async getStatus(id: number): Promise<Record<string, unknown>> {
    return this.client.get(`${API_ENDPOINTS.HOSTS}/${id}/status`);
  }

  async getMyHosts(params?: HostSearchParams): Promise<ApiResponse<Host>> {
    // Add current user filter to search
    const userFilter = 'owner = current_user';
    const searchParams = {
      ...params,
      search: params?.search ? `${params.search} and ${userFilter}` : userFilter,
    };
    return this.list(searchParams);
  }

  // Bulk operations using Foreman's native bulk API endpoints
  async bulkDelete(hostIds: number[], organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's actual bulk delete endpoint: DELETE /api/hosts/bulk
      // Uses Foreman's expected parameter format
      const response = await this.client.delete(`${API_ENDPOINTS.HOSTS}/bulk`, {
        data: {
          organization_id: organizationId || 1, // TODO: Get from auth context
          included: {
            ids: hostIds
          },
          excluded: {
            ids: []
          }
        }
      });
      return response as BulkOperationResult;
    } catch (error) {
      // Fallback to individual operations if bulk endpoint fails
      console.warn('Bulk delete endpoint failed, falling back to individual operations:', error);
      const results = await Promise.allSettled(
        hostIds.map(id => this.delete(id))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      return {
        success_count: successCount,
        failed_count: failedCount,
        errors: results
          .map((r, index) => r.status === 'rejected' ? {
            host_id: hostIds[index],
            message: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          } : null)
          .filter((error): error is NonNullable<typeof error> => error !== null)
      };
    }
  }

  async bulkUpdateHostGroup(hostIds: number[], hostgroupId: number, organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's actual bulk reassign hostgroup endpoint: PUT /api/hosts/bulk/reassign_hostgroup
      const response = await this.client.put(`${API_ENDPOINTS.HOSTS}/bulk/reassign_hostgroup`, {
        organization_id: organizationId || 1,
        included: {
          ids: hostIds
        },
        excluded: {
          ids: []
        },
        hostgroup_id: hostgroupId
      });
      return response as BulkOperationResult;
    } catch (error) {
      // Fallback to individual operations if bulk endpoint fails
      console.warn('Bulk hostgroup update endpoint failed, falling back to individual operations:', error);
      const results = await Promise.allSettled(
        hostIds.map(id => this.update(id, { hostgroup_id: hostgroupId }))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      return {
        success_count: successCount,
        failed_count: failedCount,
        errors: results
          .map((r, index) => r.status === 'rejected' ? {
            host_id: hostIds[index],
            message: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          } : null)
          .filter((error): error is NonNullable<typeof error> => error !== null)
      };
    }
  }

  async bulkUpdateOrganization(hostIds: number[], targetOrgId: number, organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's actual bulk assign organization endpoint: PUT /api/v2/hosts/bulk/assign_organization
      const response = await this.client.put(`${API_ENDPOINTS.HOSTS}/bulk/assign_organization`, {
        organization_id: organizationId || 1,
        included: {
          ids: hostIds
        },
        excluded: {
          ids: []
        },
        id: targetOrgId
      });
      return response as BulkOperationResult;
    } catch (error) {
      // Fallback to individual operations if bulk endpoint fails
      console.warn('Bulk organization assignment endpoint failed, falling back to individual operations:', error);
      const results = await Promise.allSettled(
        hostIds.map(id => this.update(id, { organization_id: targetOrgId }))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      return {
        success_count: successCount,
        failed_count: failedCount,
        errors: results
          .map((r, index) => r.status === 'rejected' ? {
            host_id: hostIds[index],
            message: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          } : null)
          .filter((error): error is NonNullable<typeof error> => error !== null)
      };
    }
  }

  async bulkUpdateLocation(hostIds: number[], targetLocationId: number, organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's actual bulk assign location endpoint: PUT /api/v2/hosts/bulk/assign_location
      const response = await this.client.put(`${API_ENDPOINTS.HOSTS}/bulk/assign_location`, {
        organization_id: organizationId || 1,
        included: {
          ids: hostIds
        },
        excluded: {
          ids: []
        },
        id: targetLocationId
      });
      return response as BulkOperationResult;
    } catch (error) {
      // Fallback to individual operations if bulk endpoint fails
      console.warn('Bulk location assignment endpoint failed, falling back to individual operations:', error);
      const results = await Promise.allSettled(
        hostIds.map(id => this.update(id, { location_id: targetLocationId }))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      return {
        success_count: successCount,
        failed_count: failedCount,
        errors: results
          .map((r, index) => r.status === 'rejected' ? {
            host_id: hostIds[index],
            message: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          } : null)
          .filter((error): error is NonNullable<typeof error> => error !== null)
      };
    }
  }

  // Additional Foreman bulk operations
  async bulkBuild(hostIds: number[], options: { reboot?: boolean; rebuildConfiguration?: boolean } = {}, organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's bulk build endpoint: PUT /api/v2/hosts/bulk/build
      const response = await this.client.put(`${API_ENDPOINTS.HOSTS}/bulk/build`, {
        organization_id: organizationId || 1,
        included: {
          ids: hostIds
        },
        excluded: {
          ids: []
        },
        reboot: options.reboot || false,
        rebuild_configuration: options.rebuildConfiguration || false
      });
      return response as BulkOperationResult;
    } catch (error) {
      // Fallback to individual operations
      console.warn('Bulk build endpoint failed, falling back to individual operations:', error);
      const results = await Promise.allSettled(
        hostIds.map(id => this.build(id))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      return {
        success_count: successCount,
        failed_count: failedCount,
        errors: results
          .map((r, index) => r.status === 'rejected' ? {
            host_id: hostIds[index],
            message: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          } : null)
          .filter((error): error is NonNullable<typeof error> => error !== null)
      };
    }
  }

  async bulkChangeOwner(hostIds: number[], ownerId: number, organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's bulk change owner endpoint: PUT /api/v2/hosts/bulk/change_owner
      const response = await this.client.put(`${API_ENDPOINTS.HOSTS}/bulk/change_owner`, {
        organization_id: organizationId || 1,
        included: {
          ids: hostIds
        },
        excluded: {
          ids: []
        },
        owner_id: ownerId
      });
      return response as BulkOperationResult;
    } catch (error) {
      // Fallback to individual operations
      console.warn('Bulk change owner endpoint failed, falling back to individual operations:', error);
      const results = await Promise.allSettled(
        hostIds.map(id => this.update(id, { owner_id: ownerId, owner_type: 'User' }))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      return {
        success_count: successCount,
        failed_count: failedCount,
        errors: results
          .map((r, index) => r.status === 'rejected' ? {
            host_id: hostIds[index],
            message: (r as PromiseRejectedResult).reason?.message || 'Unknown error'
          } : null)
          .filter((error): error is NonNullable<typeof error> => error !== null)
      };
    }
  }

  async bulkDisassociate(hostIds: number[], organizationId?: number): Promise<BulkOperationResult> {
    try {
      // Use Foreman's bulk disassociate endpoint: PUT /api/v2/hosts/bulk/disassociate
      const response = await this.client.put(`${API_ENDPOINTS.HOSTS}/bulk/disassociate`, {
        organization_id: organizationId || 1,
        included: {
          ids: hostIds
        },
        excluded: {
          ids: []
        }
      });
      return response as BulkOperationResult;
    } catch (error) {
      console.warn('Bulk disassociate endpoint failed:', error);
      throw error; // No individual operation fallback for disassociate
    }
  }

  /**
   * Fast GraphQL query to get host IDs and names for bulk selection
   * Much faster than REST API for large datasets since we only fetch minimal data
   */
  async getAllHostIdsGraphQL(searchParams: HostSearchParams = {}): Promise<{ id: number; name: string }[]> {
    // Build GraphQL query with correct Foreman schema
    const hasSearch = searchParams.search && searchParams.search.trim();

    let query: string;
    if (hasSearch) {
      // Escape quotes in search string for GraphQL
      const escapedSearch = searchParams.search!.replace(/"/g, '\\"');
      query = `
        query GetHostIds {
          hosts(search: "${escapedSearch}") {
            nodes {
              id
              name
            }
          }
        }
      `;
    } else {
      // Query without search parameters
      query = `
        query GetHostIds {
          hosts {
            nodes {
              id
              name
            }
          }
        }
      `;
    }

    try {
      const response = await this.executeGraphQLQuery(query);

      if (response.errors && response.errors.length > 0) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
      }

      if (response.data && typeof response.data === 'object' && 'hosts' in response.data) {
        const hostsData = response.data as { hosts: { nodes: { id: string; name: string }[] } };
        if (hostsData.hosts?.nodes) {
          return hostsData.hosts.nodes.map((host: { id: string; name: string }) => ({
            // Decode base64 GraphQL ID to get actual integer ID
            id: this.decodeGraphQLId(host.id),
            name: host.name || ''
          }));
        }
      }

      return [];
    } catch (error) {
      console.warn('GraphQL query failed, falling back to REST API:', error);
      // Fallback to REST API if GraphQL fails
      const restResponse = await this.getMyHosts({
        ...searchParams,
        per_page: 10000, // Large number to get all results
      });
      return restResponse.results.map(host => ({
        id: host.id,
        name: host.name
      }));
    }
  }

  /**
   * Decode Foreman's base64 encoded GraphQL ID to get the actual integer ID
   */
  private decodeGraphQLId(graphqlId: string): number {
    try {
      // Foreman uses base64 encoded IDs like "MDE6SG9zdC0x"
      const decoded = atob(graphqlId);
      // Format is typically "01:Host-1" where 1 is the actual ID
      const idMatch = decoded.match(/:(\d+)$/);
      if (idMatch) {
        return parseInt(idMatch[1], 10);
      }
      // Alternative format parsing if needed
      const altMatch = decoded.match(/(\d+)$/);
      if (altMatch) {
        return parseInt(altMatch[1], 10);
      }
      console.warn(`Could not decode GraphQL ID: ${graphqlId} -> ${decoded}`);
      return 0;
    } catch (error) {
      console.warn(`Failed to decode GraphQL ID: ${graphqlId}`, error);
      return 0;
    }
  }

  /**
   * Execute GraphQL query against Foreman's GraphQL endpoint
   */
  private async executeGraphQLQuery(query: string): Promise<{ data?: unknown; errors?: unknown[] }> {
    const token = this.client.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}