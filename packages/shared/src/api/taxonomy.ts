import { ForemanAPIClient } from './client';
import { API_ENDPOINTS, TAXONOMY_DEFAULT_VALUES } from '../constants';
import { createGraphQLClient, GraphQLClient } from './graphqlClient';
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
 * Default values for taxonomy entities when data is not available via GraphQL
 * Using constants for better maintainability
 */

/**
 * GraphQL response structure for taxonomy queries
 */
interface TaxonomyGraphQLEdge<T> {
  node: T;
}

interface TaxonomyGraphQLConnection<T> {
  edges: TaxonomyGraphQLEdge<T>[];
}

interface TaxonomyGraphQLData {
  organizations?: TaxonomyGraphQLConnection<EnhancedOrganization>;
  locations?: TaxonomyGraphQLConnection<EnhancedLocation>;
}

/**
 * Organizations API client following Foreman REST API patterns
 */
export class OrganizationsAPI {
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.graphqlClient = createGraphQLClient(client);
  }

  async list(params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedOrganization[]>> {
    // Try GraphQL first for efficient single-query data fetching
    try {
      const query = `
        query OrganizationsList {
          organizations {
            edges {
              node {
                id
                name
                title
              }
            }
          }
        }
      `;

      const graphqlResponse = await this.graphqlClient.query<TaxonomyGraphQLData>(query);

      if (graphqlResponse.data?.organizations?.edges) {
        const organizations = graphqlResponse.data.organizations.edges.map(edge => ({
          ...edge.node,
          description: TAXONOMY_DEFAULT_VALUES.DESCRIPTION, // Not available in GraphQL schema
          hosts_count: TAXONOMY_DEFAULT_VALUES.HOSTS_COUNT, // Not fetched via GraphQL for performance
          users_count: TAXONOMY_DEFAULT_VALUES.USERS_COUNT, // Not fetched via GraphQL for performance
        }));

        return {
          results: organizations,
          total: organizations.length,
          page: 1,
          per_page: organizations.length,
          subtotal: organizations.length
        };
      }

      // Handle GraphQL errors by falling back to REST
      if ((graphqlResponse.errors?.length ?? 0) > 0) {
        console.warn('GraphQL organizations query failed, falling back to REST:', graphqlResponse.errors);
      }
    } catch (error) {
      console.warn('GraphQL organizations query error, falling back to REST:', error);
    }

    // Fallback to REST API
    return this.getRestData(params);
  }

  async getRestData(params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedOrganization[]>> {
    const searchParams = {
      per_page: 100,
      ...params
    };
    
    return this.client.getPaginated<EnhancedOrganization>(API_ENDPOINTS.ORGANIZATIONS, searchParams);
  }

  async get(id: number): Promise<EnhancedOrganization> {
    return this.client.get<EnhancedOrganization>(`${API_ENDPOINTS.ORGANIZATIONS}/${id}`);
  }

  async create(data: OrganizationCreateData): Promise<EnhancedOrganization> {
    return this.client.post<EnhancedOrganization>(API_ENDPOINTS.ORGANIZATIONS, { organization: data });
  }

  async update(id: number, data: OrganizationUpdateData): Promise<EnhancedOrganization> {
    return this.client.put<EnhancedOrganization>(`${API_ENDPOINTS.ORGANIZATIONS}/${id}`, { organization: data });
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`${API_ENDPOINTS.ORGANIZATIONS}/${id}`);
  }

  async search(query: string, params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedOrganization[]>> {
    return this.list({ ...params, search: query });
  }

  async getHostsCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`${API_ENDPOINTS.ORGANIZATIONS}/${id}/hosts`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }

  async getUsersCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`${API_ENDPOINTS.ORGANIZATIONS}/${id}/users`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }
}

/**
 * Locations API client following Foreman REST API patterns
 */
export class LocationsAPI {
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.graphqlClient = createGraphQLClient(client);
  }

  async list(params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedLocation[]>> {
    // Try GraphQL first for efficient single-query data fetching
    try {
      const query = `
        query LocationsList {
          locations {
            edges {
              node {
                id
                name
                title
              }
            }
          }
        }
      `;

      const graphqlResponse = await this.graphqlClient.query<TaxonomyGraphQLData>(query);

      if (graphqlResponse.data?.locations?.edges) {
        const locations = graphqlResponse.data.locations.edges.map(edge => ({
          ...edge.node,
          description: TAXONOMY_DEFAULT_VALUES.DESCRIPTION, // Not available in GraphQL schema
          hosts_count: TAXONOMY_DEFAULT_VALUES.HOSTS_COUNT, // Not fetched via GraphQL for performance
          users_count: TAXONOMY_DEFAULT_VALUES.USERS_COUNT, // Not fetched via GraphQL for performance
        }));

        return {
          results: locations,
          total: locations.length,
          page: 1,
          per_page: locations.length,
          subtotal: locations.length
        };
      }

      // Handle GraphQL errors by falling back to REST
      if ((graphqlResponse.errors?.length ?? 0) > 0) {
        console.warn('GraphQL locations query failed, falling back to REST:', graphqlResponse.errors);
      }
    } catch (error) {
      console.warn('GraphQL locations query error, falling back to REST:', error);
    }

    // Fallback to REST API
    return this.getRestData(params);
  }

  async getRestData(params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedLocation[]>> {
    const searchParams = {
      per_page: 100,
      ...params
    };
    
    return this.client.getPaginated<EnhancedLocation>(API_ENDPOINTS.LOCATIONS, searchParams);
  }

  async get(id: number): Promise<EnhancedLocation> {
    return this.client.get<EnhancedLocation>(`${API_ENDPOINTS.LOCATIONS}/${id}`);
  }

  async create(data: LocationCreateData): Promise<EnhancedLocation> {
    return this.client.post<EnhancedLocation>(API_ENDPOINTS.LOCATIONS, { location: data });
  }

  async update(id: number, data: LocationUpdateData): Promise<EnhancedLocation> {
    return this.client.put<EnhancedLocation>(`${API_ENDPOINTS.LOCATIONS}/${id}`, { location: data });
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`${API_ENDPOINTS.LOCATIONS}/${id}`);
  }

  async search(query: string, params?: TaxonomyQueryParams): Promise<TaxonomyApiResponse<EnhancedLocation[]>> {
    return this.list({ ...params, search: query });
  }

  async getHostsCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`${API_ENDPOINTS.LOCATIONS}/${id}/hosts`, { 
      params: { per_page: 1 } 
    });
    return response.total;
  }

  async getUsersCount(id: number): Promise<number> {
    const response = await this.client.get<{ total: number }>(`${API_ENDPOINTS.LOCATIONS}/${id}/users`, { 
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
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.organizations = new OrganizationsAPI(client);
    this.locations = new LocationsAPI(client);
    this.graphqlClient = createGraphQLClient(client);
  }

  /**
   * Get both organizations and locations efficiently via GraphQL
   */
  async getAll(params?: TaxonomyQueryParams): Promise<{
    organizations: TaxonomyApiResponse<EnhancedOrganization[]>;
    locations: TaxonomyApiResponse<EnhancedLocation[]>;
  }> {
    // Try GraphQL first for most efficient single-query fetch
    try {
      const query = `
        query TaxonomyData {
          organizations {
            edges {
              node {
                id
                name
                title
              }
            }
          }
          locations {
            edges {
              node {
                id
                name
                title
              }
            }
          }
        }
      `;

      const graphqlResponse = await this.graphqlClient.query<TaxonomyGraphQLData>(query);

      if (graphqlResponse.data?.organizations?.edges && graphqlResponse.data?.locations?.edges) {
        const organizations = graphqlResponse.data.organizations.edges.map(edge => ({
          ...edge.node,
          description: TAXONOMY_DEFAULT_VALUES.DESCRIPTION, // Not available in GraphQL schema
          hosts_count: TAXONOMY_DEFAULT_VALUES.HOSTS_COUNT, // Not fetched for performance
          users_count: TAXONOMY_DEFAULT_VALUES.USERS_COUNT, // Not fetched for performance
        }));

        const locations = graphqlResponse.data.locations.edges.map(edge => ({
          ...edge.node,
          description: TAXONOMY_DEFAULT_VALUES.DESCRIPTION, // Not available in GraphQL schema
          hosts_count: TAXONOMY_DEFAULT_VALUES.HOSTS_COUNT, // Not fetched for performance
          users_count: TAXONOMY_DEFAULT_VALUES.USERS_COUNT, // Not fetched for performance
        }));

        return {
          organizations: {
            results: organizations,
            total: organizations.length,
            page: 1,
            per_page: organizations.length,
            subtotal: organizations.length
          },
          locations: {
            results: locations,
            total: locations.length,
            page: 1,
            per_page: locations.length,
            subtotal: locations.length
          }
        };
      }

      // Handle GraphQL errors by falling back to REST
      if ((graphqlResponse.errors?.length ?? 0) > 0) {
        console.warn('GraphQL taxonomy query failed, falling back to REST:', graphqlResponse.errors);
      }
    } catch (error) {
      console.warn('GraphQL taxonomy query error, falling back to REST:', error);
    }

    // Fallback to REST API with parallel requests
    return this.getRestDataCombined(params);
  }

  private async getRestDataCombined(params?: TaxonomyQueryParams): Promise<{
    organizations: TaxonomyApiResponse<EnhancedOrganization[]>;
    locations: TaxonomyApiResponse<EnhancedLocation[]>;
  }> {
    const [organizations, locations] = await Promise.all([
      this.organizations.getRestData(params),
      this.locations.getRestData(params)
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