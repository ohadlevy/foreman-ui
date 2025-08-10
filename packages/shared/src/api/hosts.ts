import { ForemanAPIClient } from './client';
import { Host, HostSearchParams, HostFormData, ApiResponse, BulkOperationRequest, BulkOperationResult } from '../types';
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

  async bulkOperation(request: BulkOperationRequest): Promise<BulkOperationResult> {
    return this.client.post<BulkOperationResult>(`${API_ENDPOINTS.HOSTS}/bulk_action`, request);
  }

  async bulkDelete(hostIds: number[]): Promise<BulkOperationResult> {
    return this.bulkOperation({
      operation: 'destroy',
      host_ids: hostIds,
    });
  }

  async bulkUpdateHostGroup(hostIds: number[], hostgroupId: number): Promise<BulkOperationResult> {
    return this.bulkOperation({
      operation: 'update',
      host_ids: hostIds,
      parameters: {
        hostgroup_id: hostgroupId,
      },
    });
  }

  async bulkUpdateOrganization(hostIds: number[], organizationId: number): Promise<BulkOperationResult> {
    return this.bulkOperation({
      operation: 'update',
      host_ids: hostIds,
      parameters: {
        organization_id: organizationId,
      },
    });
  }

  async bulkUpdateLocation(hostIds: number[], locationId: number): Promise<BulkOperationResult> {
    return this.bulkOperation({
      operation: 'update',
      host_ids: hostIds,
      parameters: {
        location_id: locationId,
      },
    });
  }
}