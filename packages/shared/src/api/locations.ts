import { ForemanAPIClient } from './client';
import { Location, SearchParams, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';
import { parseGraphQLId } from '../utils/graphql';

interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

interface LocationsResponse {
  data?: {
    currentUser?: {
      locations?: {
        edges?: Array<{
          node: {
            id: string;
            name: string;
            title?: string;
            description?: string;
            ancestry?: string;
          };
        }>;
      };
    };
    locations?: {
      edges?: Array<{
        node: {
          id: string;
          name: string;
          title?: string;
          description?: string;
          ancestry?: string;
        };
      }>;
    };
  };
  errors?: GraphQLError[];
}

export class LocationsAPI {
  constructor(private client: ForemanAPIClient) {}

  private parseLocationIdFromGraphQL(rawId: string): number {
    try {
      return parseGraphQLId(rawId);
    } catch (error) {
      console.warn('Failed to parse GraphQL location ID:', error);
      throw new Error('Invalid location ID format');
    }
  }

  private async executeGraphQLQuery(query: string): Promise<LocationsResponse> {
    try {
      // Use the API client's post method instead of direct fetch
      // This ensures proper authentication, error handling, and interceptors
      // Extract relative path from GraphQL endpoint URL
      const fullUrl = API_ENDPOINTS.GRAPHQL;

      // Handle both absolute and relative URLs
      let graphqlUrl: string;
      if (fullUrl.startsWith('http')) {
        // Absolute URL - extract path and search
        const urlObj = new globalThis.URL(fullUrl);
        graphqlUrl = urlObj.pathname + urlObj.search;
      } else {
        // Relative URL - use as is
        graphqlUrl = fullUrl;
      }

      // Use direct fetch to avoid baseURL being prepended  
      const baseUrl = this.client.baseURL.replace('/api/v2', '');
      const fullGraphqlUrl = baseUrl + graphqlUrl;
      
      const token = this.client.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(fullGraphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`GraphQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertGraphQLToLocation(node: {
    id: string;
    name: string;
    title?: string;
    description?: string;
    ancestry?: string;
  }): Location {
    return {
      id: this.parseLocationIdFromGraphQL(node.id),
      name: node.name || '',
      title: node.title || node.name || '',
      description: node.description || '',
      ancestry: node.ancestry || undefined,
    };
  }

  async getUserLocations(): Promise<Location[]> {
    // Try GraphQL first for efficient data fetching
    try {
      const query = `
        query UserLocations {
          currentUser {
            locations {
              edges {
                node {
                  id
                  name
                  title
                  description
                  ancestry
                }
              }
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);

      if (response.data?.currentUser?.locations?.edges) {
        return response.data.currentUser.locations.edges.map(edge =>
          this.convertGraphQLToLocation(edge.node)
        );
      }

      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL errors for user locations:', response.errors);
      }

      // Fall back to REST API if GraphQL fails
      console.warn('GraphQL user locations query failed, falling back to REST API');
      return await this.getUserLocationsRest();
    } catch (error) {
      console.warn('GraphQL user locations query failed, falling back to REST API:', error);
      return await this.getUserLocationsRest();
    }
  }

  async list(params?: SearchParams): Promise<ApiResponse<Location>> {
    // Try GraphQL first for efficient data fetching
    try {
      const query = `
        query Locations {
          locations {
            edges {
              node {
                id
                name
                title
                description
                ancestry
              }
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);

      if (response.data?.locations?.edges) {
        const locations = response.data.locations.edges.map(edge =>
          this.convertGraphQLToLocation(edge.node)
        );

        return {
          total: locations.length,
          subtotal: locations.length,
          page: 1,
          per_page: locations.length,
          results: locations,
        };
      }

      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL errors for locations list:', response.errors);
      }

      // Fall back to REST API if GraphQL fails
      console.warn('GraphQL locations query failed, falling back to REST API');
      return await this.listRest(params);
    } catch (error) {
      console.warn('GraphQL locations query failed, falling back to REST API:', error);
      return await this.listRest(params);
    }
  }

  async get(id: number): Promise<Location> {
    return this.client.get<Location>(`${API_ENDPOINTS.LOCATIONS}/${id}`);
  }

  // REST API fallback methods
  private async getUserLocationsRest(): Promise<Location[]> {
    try {
      const currentUser = await this.client.get<{ locations: Location[] }>('/current_user');
      return currentUser.locations || [];
    } catch (error) {
      console.warn('REST API user locations failed:', error);
      return [];
    }
  }

  private async listRest(params?: SearchParams): Promise<ApiResponse<Location>> {
    return this.client.getPaginated<Location>(API_ENDPOINTS.LOCATIONS, params);
  }
}