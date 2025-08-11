import { ForemanAPIClient } from './client';
import type { 
  EnhancedOrganization, 
  EnhancedLocation,
  OrganizationCreateData,
  LocationCreateData,
  OrganizationUpdateData,
  LocationUpdateData,
  TaxonomyApiResponse,
  TaxonomyQueryParams
} from '../types/taxonomy';

/**
 * Organizations API client following Foreman REST API patterns
 */
export class OrganizationsAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedOrganization[]>> {
    const searchParams = {
      per_page: 100,
      include_hosts_count: true,
      include_users_count: true,
      ...params
    };
    
    return this.client.getPaginated<EnhancedOrganization>('/api/v2/organizations', searchParams);
  }

  async get(id: number): Promise<EnhancedOrganization> {
    return this.client.get<EnhancedOrganization>(`/api/v2/organizations/${id}`, {
      params: {
        include_hosts_count: true,
        include_users_count: true
      }
    });
  }

  async create(data: OrganizationCreateData): Promise<EnhancedOrganization> {
    return this.client.post<EnhancedOrganization>('/api/v2/organizations', { organization: data });
  }

  async update(id: number, data: OrganizationUpdateData): Promise<EnhancedOrganization> {
    return this.client.put<EnhancedOrganization>(`/api/v2/organizations/${id}`, { organization: data });
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`/api/v2/organizations/${id}`);
  }

  async search(query: string, params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedOrganization[]>> {
    return this.list({ ...params, search: query });
  }

  async getHostsCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`/api/v2/organizations/${id}/hosts`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }

  async getUsersCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`/api/v2/organizations/${id}/users`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }
}

/**
 * Locations API client following Foreman REST API patterns
 */
export class LocationsAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedLocation[]>> {
    const searchParams = {
      per_page: 100,
      include_hosts_count: true,
      include_users_count: true,
      ...params
    };
    
    return this.client.getPaginated<EnhancedLocation>('/api/v2/locations', searchParams);
  }

  async get(id: number): Promise<EnhancedLocation> {
    return this.client.get<EnhancedLocation>(`/api/v2/locations/${id}`, {
      params: {
        include_hosts_count: true,
        include_users_count: true
      }
    });
  }

  async create(data: LocationCreateData): Promise<EnhancedLocation> {
    return this.client.post<EnhancedLocation>('/api/v2/locations', { location: data });
  }

  async update(id: number, data: LocationUpdateData): Promise<EnhancedLocation> {
    return this.client.put<EnhancedLocation>(`/api/v2/locations/${id}`, { location: data });
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`/api/v2/locations/${id}`);
  }

  async search(query: string, params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedLocation[]>> {
    return this.list({ ...params, search: query });
  }

  async getHostsCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`/api/v2/locations/${id}/hosts`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }

  async getUsersCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`/api/v2/locations/${id}/users`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }
}

/**
 * Combined taxonomy API client
 */
export class TaxonomyAPI {
  public readonly organizations: OrganizationsAPI;
  public readonly locations: LocationsAPI;

  constructor(client: ForemanAPIClient) {
    this.organizations = new OrganizationsAPI(client);
    this.locations = new LocationsAPI(client);
  }

  /**
   * Get both organizations and locations in parallel
   */
  async getAll(params?: TaxonomyQueryParams): Promise<{
    organizations: TaxonomyApiResponse<EnhancedOrganization[]>;
    locations: TaxonomyApiResponse<EnhancedLocation[]>;
  }> {
    const [organizations, locations] = await Promise.all([
      this.organizations.list(params),
      this.locations.list(params)
    ]);

    return { organizations, locations };
  }

  /**
   * Search both organizations and locations
   */
  async searchAll(query: string, params?: TaxonomyQueryParams): Promise<{
    organizations: TaxonomyApiResponse<EnhancedOrganization[]>;
    locations: TaxonomyApiResponse<EnhancedLocation[]>;
  }> {
    const [organizations, locations] = await Promise.all([
      this.organizations.search(query, params),
      this.locations.search(query, params)
    ]);

    return { organizations, locations };
  }
}