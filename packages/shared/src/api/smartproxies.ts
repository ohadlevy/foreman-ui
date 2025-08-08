import { ForemanAPIClient } from './client';
import { SmartProxy, SearchParams, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export class SmartProxiesAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: SearchParams): Promise<ApiResponse<SmartProxy>> {
    return this.client.getPaginated<SmartProxy>(API_ENDPOINTS.SMART_PROXIES, params);
  }

  async get(id: number): Promise<SmartProxy> {
    return this.client.get<SmartProxy>(`${API_ENDPOINTS.SMART_PROXIES}/${id}`);
  }
}