import { ForemanAPIClient } from './client';
import { SearchParams, ApiResponse, ApiError } from '../types';
import { AxiosRequestConfig } from 'axios';

// Import the store type but don't import the store directly to avoid circular dependencies
type TaxonomyStore = {
  currentOrganization: { id: number } | null;
  currentLocation: { id: number } | null;
};

// Define public interface that matches what the API classes need from ForemanAPIClient
export interface APIClientInterface {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  getPaginated<T>(url: string, params?: SearchParams): Promise<ApiResponse<T>>;
  baseURL: string;
  getToken(): string | undefined;
  setToken(token: string): void;
  clearToken(): void;
  setLoggingOut(isLoggingOut: boolean): void;
  handleError(error: unknown): ApiError;
}

// Create a TaxonomyAwareAPIClient that's compatible with ForemanAPIClient
export class TaxonomyAwareAPIClient implements APIClientInterface {
  public baseURL: string;

  constructor(
    private client: ForemanAPIClient,
    private getTaxonomyContext: () => TaxonomyStore
  ) {
    this.baseURL = client.baseURL;
  }

  private addTaxonomyParams(params: SearchParams = {}): SearchParams {
    const context = this.getTaxonomyContext();
    const enhancedParams = { ...params };

    // Add organization context if set
    if (context.currentOrganization) {
      enhancedParams.organization_id = context.currentOrganization.id;
    }

    // Add location context if set
    if (context.currentLocation) {
      enhancedParams.location_id = context.currentLocation.id;
    }

    return enhancedParams;
  }

  // Wrapper methods that automatically add taxonomy context
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // For get requests, merge taxonomy params into the config.params
    const taxonomyParams = this.getTaxonomyContext();
    const enhancedConfig = { ...config };

    if (taxonomyParams.currentOrganization || taxonomyParams.currentLocation) {
      enhancedConfig.params = {
        ...enhancedConfig.params,
        ...(taxonomyParams.currentOrganization && { organization_id: taxonomyParams.currentOrganization.id }),
        ...(taxonomyParams.currentLocation && { location_id: taxonomyParams.currentLocation.id }),
      };
    }

    return this.client.get<T>(url, enhancedConfig);
  }

  async getPaginated<T>(url: string, params?: SearchParams): Promise<ApiResponse<T>> {
    const enhancedParams = this.addTaxonomyParams(params);
    return this.client.getPaginated<T>(url, enhancedParams);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // For POST/PUT requests, we add taxonomy context as query params in the URL
    const taxonomyParams = this.getTaxonomyContext();
    let enhancedUrl = url;

    if (taxonomyParams.currentOrganization || taxonomyParams.currentLocation) {
      const queryParams: string[] = [];
      if (taxonomyParams.currentOrganization) {
        queryParams.push(`organization_id=${taxonomyParams.currentOrganization.id}`);
      }
      if (taxonomyParams.currentLocation) {
        queryParams.push(`location_id=${taxonomyParams.currentLocation.id}`);
      }
      const queryString = queryParams.join('&');
      enhancedUrl = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }

    return this.client.post<T>(enhancedUrl, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // For POST/PUT requests, we add taxonomy context as query params in the URL
    const taxonomyParams = this.getTaxonomyContext();
    let enhancedUrl = url;

    if (taxonomyParams.currentOrganization || taxonomyParams.currentLocation) {
      const queryParams: string[] = [];
      if (taxonomyParams.currentOrganization) {
        queryParams.push(`organization_id=${taxonomyParams.currentOrganization.id}`);
      }
      if (taxonomyParams.currentLocation) {
        queryParams.push(`location_id=${taxonomyParams.currentLocation.id}`);
      }
      const queryString = queryParams.join('&');
      enhancedUrl = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }

    return this.client.put<T>(enhancedUrl, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // For delete requests, merge taxonomy params into the config.params
    const taxonomyParams = this.getTaxonomyContext();
    const enhancedConfig = { ...config };

    if (taxonomyParams.currentOrganization || taxonomyParams.currentLocation) {
      enhancedConfig.params = {
        ...enhancedConfig.params,
        ...(taxonomyParams.currentOrganization && { organization_id: taxonomyParams.currentOrganization.id }),
        ...(taxonomyParams.currentLocation && { location_id: taxonomyParams.currentLocation.id }),
      };
    }

    return this.client.delete<T>(url, enhancedConfig);
  }

  // Pass through methods that don't need taxonomy context
  getToken(): string | undefined {
    return this.client.getToken();
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }

  // Additional methods required by the interface
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // For PATCH requests, we add taxonomy context as query params in the URL
    const taxonomyParams = this.getTaxonomyContext();
    let enhancedUrl = url;

    if (taxonomyParams.currentOrganization || taxonomyParams.currentLocation) {
      const queryParams: string[] = [];
      if (taxonomyParams.currentOrganization) {
        queryParams.push(`organization_id=${taxonomyParams.currentOrganization.id}`);
      }
      if (taxonomyParams.currentLocation) {
        queryParams.push(`location_id=${taxonomyParams.currentLocation.id}`);
      }
      const queryString = queryParams.join('&');
      enhancedUrl = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }

    return this.client.patch<T>(enhancedUrl, data, config);
  }

  // Required methods for compatibility with ForemanAPIClient
  handleError(error: unknown): ApiError {
    return this.client.handleError(error);
  }

  setLoggingOut(isLoggingOut: boolean): void {
    this.client.setLoggingOut(isLoggingOut);
  }


  // For cases where you specifically don't want taxonomy context (like auth, etc.)
  getUnscoped(): ForemanAPIClient {
    return this.client;
  }
}

// Helper function to create a taxonomy-aware client that's compatible with ForemanAPIClient
export const createTaxonomyAwareClient = (
  client: ForemanAPIClient,
  getTaxonomyContext: () => TaxonomyStore
): APIClientInterface => {
  return new TaxonomyAwareAPIClient(client, getTaxonomyContext);
};