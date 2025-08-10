import { ForemanAPIClient } from './client';
import { GraphQLClient, createGraphQLClient } from './graphqlClient';
import { HostGroup, SmartProxy } from '../types';
import { API_ENDPOINTS } from '../constants';


export interface RegistrationFormData {
  hostGroups: HostGroup[];
  smartProxies: SmartProxy[];
}

interface GraphQLConnection<T> {
  edges: Array<{
    node: T;
  }>;
}

interface RegistrationFormGraphQLData {
  hostgroups?: GraphQLConnection<HostGroup>;
  smartProxies?: GraphQLConnection<SmartProxy>;
}


export class RegistrationFormAPI {
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.graphqlClient = createGraphQLClient(client);
  }

  async getFormData(): Promise<RegistrationFormData> {
    try {
      // GraphQL query using Foreman's actual schema with connection/pagination structure
      const query = `
        query RegistrationFormData {
          hostgroups {
            edges {
              node {
                id
                name
                title
                description
              }
            }
          }
          smartProxies {
            edges {
              node {
                id
                name
                url
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await this.graphqlClient.query<RegistrationFormGraphQLData>(query);

      if (response.data) {
        return {
          hostGroups: response.data.hostgroups?.edges?.map(edge => edge.node) || [],
          smartProxies: response.data.smartProxies?.edges?.map(edge => edge.node) || [],
        };
      }

      if (response.errors?.length) {
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

}