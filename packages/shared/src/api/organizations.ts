import { ForemanAPIClient } from './client';
import { Organization, SearchParams, ApiResponse } from '../types';
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

interface OrganizationsResponse {
  data?: {
    currentUser?: {
      organizations?: {
        edges?: Array<{
          node: {
            id: string;
            name: string;
            title?: string;
            description?: string;
            ancestry?: string;
            label?: string;
          };
        }>;
      };
    };
    organizations?: {
      edges?: Array<{
        node: {
          id: string;
          name: string;
          title?: string;
          description?: string;
          ancestry?: string;
          label?: string;
        };
      }>;
    };
  };
  errors?: GraphQLError[];
}

export class OrganizationsAPI {
  constructor(private client: ForemanAPIClient) {}

  private parseOrganizationIdFromGraphQL(rawId: string): number {
    try {
      return parseGraphQLId(rawId);
    } catch (error) {
      console.warn('Failed to parse GraphQL organization ID:', error);
      throw new Error('Invalid organization ID format');
    }
  }

  private async executeGraphQLQuery(query: string): Promise<OrganizationsResponse> {
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

      return await this.client.post<OrganizationsResponse>(graphqlUrl, { query }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
    } catch (error) {
      throw new Error(`GraphQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertGraphQLToOrganization(node: {
    id: string;
    name: string;
    title?: string;
    description?: string;
    ancestry?: string;
    label?: string;
  }): Organization {
    return {
      id: this.parseOrganizationIdFromGraphQL(node.id),
      name: node.name || '',
      title: node.title || node.name || '',
      description: node.description || '',
      ancestry: node.ancestry || undefined,
      label: node.label || undefined,
    };
  }

  async getUserOrganizations(): Promise<Organization[]> {
    // Try GraphQL first for efficient data fetching
    try {
      const query = `
        query UserOrganizations {
          currentUser {
            organizations {
              edges {
                node {
                  id
                  name
                  title
                  description
                  ancestry
                  label
                }
              }
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);

      if (response.data?.currentUser?.organizations?.edges) {
        return response.data.currentUser.organizations.edges.map(edge =>
          this.convertGraphQLToOrganization(edge.node)
        );
      }

      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL errors for user organizations:', response.errors);
      }

      // Fall back to REST API if GraphQL fails
      console.warn('GraphQL user organizations query failed, falling back to REST API');
      return await this.getUserOrganizationsRest();
    } catch (error) {
      console.warn('GraphQL user organizations query failed, falling back to REST API:', error);
      return await this.getUserOrganizationsRest();
    }
  }

  async list(params?: SearchParams): Promise<ApiResponse<Organization>> {
    // Try GraphQL first for efficient data fetching
    try {
      const query = `
        query Organizations {
          organizations {
            edges {
              node {
                id
                name
                title
                description
                ancestry
                label
              }
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);

      if (response.data?.organizations?.edges) {
        const organizations = response.data.organizations.edges.map(edge =>
          this.convertGraphQLToOrganization(edge.node)
        );

        return {
          total: organizations.length,
          subtotal: organizations.length,
          page: 1,
          per_page: organizations.length,
          results: organizations,
        };
      }

      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL errors for organizations list:', response.errors);
      }

      // Fall back to REST API if GraphQL fails
      console.warn('GraphQL organizations query failed, falling back to REST API');
      return await this.listRest(params);
    } catch (error) {
      console.warn('GraphQL organizations query failed, falling back to REST API:', error);
      return await this.listRest(params);
    }
  }

  async get(id: number): Promise<Organization> {
    return this.client.get<Organization>(`${API_ENDPOINTS.ORGANIZATIONS}/${id}`);
  }

  // REST API fallback methods
  private async getUserOrganizationsRest(): Promise<Organization[]> {
    try {
      const currentUser = await this.client.get<{ organizations: Organization[] }>('/current_user');
      return currentUser.organizations || [];
    } catch (error) {
      console.warn('REST API user organizations failed:', error);
      return [];
    }
  }

  private async listRest(params?: SearchParams): Promise<ApiResponse<Organization>> {
    return this.client.getPaginated<Organization>(API_ENDPOINTS.ORGANIZATIONS, params);
  }
}