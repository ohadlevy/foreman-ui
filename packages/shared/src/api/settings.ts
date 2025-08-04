import { ForemanAPIClient } from './client';
import { SearchParams, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export interface Setting {
  id: number;
  name: string;
  value: unknown;
  description?: string;
  category: string;
  settings_type: string;
  default?: unknown;
  full_name?: string;
  readonly?: boolean;
  encrypted?: boolean;
}

export interface SettingFormData {
  value: unknown;
}

export interface SettingsSearchParams extends SearchParams {
  category?: string;
  name?: string;
}

export class SettingsAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: SettingsSearchParams): Promise<ApiResponse<Setting>> {
    return this.client.getPaginated<Setting>(API_ENDPOINTS.SETTINGS, params);
  }

  async get(id: number): Promise<Setting> {
    return this.client.get<Setting>(`${API_ENDPOINTS.SETTINGS}/${id}`);
  }

  async getByName(name: string): Promise<Setting> {
    return this.client.get<Setting>(`${API_ENDPOINTS.SETTINGS}/${name}`);
  }

  async update(id: number, data: SettingFormData): Promise<Setting> {
    return this.client.put<Setting>(`${API_ENDPOINTS.SETTINGS}/${id}`, { 
      setting: data 
    });
  }

  async updateByName(name: string, data: SettingFormData): Promise<Setting> {
    return this.client.put<Setting>(`${API_ENDPOINTS.SETTINGS}/${name}`, { 
      setting: data 
    });
  }

  async getCategories(): Promise<{ categories: string[] }> {
    return this.client.get<{ categories: string[] }>(`${API_ENDPOINTS.SETTINGS}/categories`);
  }

  async resetToDefault(id: number): Promise<Setting> {
    return this.client.delete(`${API_ENDPOINTS.SETTINGS}/${id}/reset`);
  }
}