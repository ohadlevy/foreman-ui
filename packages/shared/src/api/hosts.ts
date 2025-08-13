import { ForemanAPIClient } from './client';
import { Host, HostSearchParams, HostFormData, ApiResponse } from '../types';
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

}