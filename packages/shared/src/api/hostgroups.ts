import { ForemanAPIClient } from './client';
import { HostGroup, SearchParams, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export class HostGroupsAPI {
  constructor(private client: ForemanAPIClient) {}

  async get(id: number): Promise<HostGroup> {
    return this.client.get<HostGroup>(`${API_ENDPOINTS.HOSTGROUPS}/${id}`);
  }

  async list(params?: SearchParams): Promise<ApiResponse<HostGroup>> {
    return this.client.getPaginated<HostGroup>(API_ENDPOINTS.HOSTGROUPS, params);
  }
}