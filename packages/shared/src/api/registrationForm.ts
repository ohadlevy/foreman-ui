import { ForemanAPIClient } from './client';
import { HostGroup, SmartProxy } from '../types';
import { API_ENDPOINTS } from '../constants';

interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface RegistrationFormData {
  hostGroups: HostGroup[];
  smartProxies: SmartProxy[];
}

interface RegistrationFormResponse {
  data?: {
    hostgroups?: {
      nodes: HostGroup[];
    };
    smartProxies?: {
      nodes: SmartProxy[];
    };
  };
  errors?: GraphQLError[];
}

export class RegistrationFormAPI {
  constructor(private client: ForemanAPIClient) {}

  async getFormData(): Promise<RegistrationFormData> {
    try {
      // Single GraphQL query to fetch all registration form data
      const query = `
        query RegistrationFormData {
          hostgroups {
            nodes {
              id
              name
              title
              description
            }
          }
          smartProxies {
            nodes {
              id
              name
              url
              createdAt
              updatedAt
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);

      if (response.data) {
        return {
          hostGroups: response.data.hostgroups?.nodes || [],
          smartProxies: response.data.smartProxies?.nodes || [],
        };
      }

      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL errors for registration form data:', response.errors);
      }

      // Fallback to REST API if GraphQL fails
      console.warn('GraphQL registration form query failed, falling back to REST API');
      return await this.getFormDataRest();
    } catch (error) {
      console.warn('GraphQL registration form query failed, falling back to REST API:', error);
      return await this.getFormDataRest();
    }
  }

  private async getFormDataRest(): Promise<RegistrationFormData> {
    try {
      // Fetch both resources in parallel using REST API
      const [hostGroupsResponse, smartProxiesResponse] = await Promise.all([
        this.client.getPaginated<HostGroup>(API_ENDPOINTS.HOSTGROUPS),
        this.client.getPaginated<SmartProxy>(API_ENDPOINTS.SMART_PROXIES),
      ]);

      return {
        hostGroups: hostGroupsResponse.results || [],
        smartProxies: smartProxiesResponse.results || [],
      };
    } catch (error) {
      console.warn('Both GraphQL and REST API failed for registration form data, returning empty results:', error);
      return {
        hostGroups: [],
        smartProxies: [],
      };
    }
  }

  private async executeGraphQLQuery(query: string): Promise<RegistrationFormResponse> {
    const token = this.client.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.client.baseURL.replace('/api/v2', '')}${API_ENDPOINTS.GRAPHQL}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.status}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to parse GraphQL response: ${error}`);
    }
  }
}