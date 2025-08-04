import { ForemanAPIClient } from './client';
import { 
  SmartProxy, 
  SmartProxyFormData, 
  SmartProxyStatus, 
  SearchParams, 
  ApiResponse 
} from '../types';
import { API_ENDPOINTS } from '../constants';

export class SmartProxiesAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: SearchParams): Promise<ApiResponse<SmartProxy>> {
    return this.client.getPaginated<SmartProxy>(API_ENDPOINTS.SMART_PROXIES, params);
  }

  async get(id: number): Promise<SmartProxy> {
    return this.client.get<SmartProxy>(`${API_ENDPOINTS.SMART_PROXIES}/${id}`);
  }

  async create(data: SmartProxyFormData): Promise<SmartProxy> {
    return this.client.post<SmartProxy>(API_ENDPOINTS.SMART_PROXIES, { 
      smart_proxy: data 
    });
  }

  async update(id: number, data: Partial<SmartProxyFormData>): Promise<SmartProxy> {
    return this.client.put<SmartProxy>(`${API_ENDPOINTS.SMART_PROXIES}/${id}`, { 
      smart_proxy: data 
    });
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`${API_ENDPOINTS.SMART_PROXIES}/${id}`);
  }

  async refresh(id: number): Promise<SmartProxy> {
    return this.client.put<SmartProxy>(`${API_ENDPOINTS.SMART_PROXIES}/${id}/refresh`, {});
  }

  async getStatus(id: number): Promise<SmartProxyStatus> {
    return this.client.get<SmartProxyStatus>(`${API_ENDPOINTS.SMART_PROXIES}/${id}/status`);
  }

  async importPuppetClasses(id: number): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(`${API_ENDPOINTS.SMART_PROXIES}/${id}/import_puppetclasses`, {});
  }

  async getFeatures(id: number): Promise<{ features: string[] }> {
    return this.client.get<{ features: string[] }>(`${API_ENDPOINTS.SMART_PROXIES}/${id}/features`);
  }

  async testConnection(url: string): Promise<{ status: 'success' | 'error'; message: string }> {
    return this.client.post<{ status: 'success' | 'error'; message: string }>('/smart_proxies/test_connection', { 
      url 
    });
  }
}