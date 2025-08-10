import { ForemanAPIClient } from './client';
import { GraphQLClient, createGraphQLClient } from './graphqlClient';
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
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.graphqlClient = createGraphQLClient(client);
  }

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
    return await this.graphqlClient.query<RegistrationFormResponse['data']>(query);
  }
}