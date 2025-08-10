import { ForemanAPIClient } from './client';
import { GraphQLClient, createGraphQLClient } from './graphqlClient';
import { OrganizationsAPI } from './organizations';
import { LocationsAPI } from './locations';
import { User, Organization, Location, Permission } from '../types';
import { parseGraphQLId } from '../utils/graphql';

export interface UserContextData {
  user: User | null;
  organizations: Organization[];
  locations: Location[];
  permissions?: Permission[];
}

// Combined interface that extends existing GraphQL response types
interface GraphQLUserContextResponse {
  data?: {
    currentUser?: {
      id: string;
      login: string;
      firstname?: string;
      lastname?: string;
      email?: string;
      // Reuse the organization structure from OrganizationsAPI
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
      // Reuse the location structure from LocationsAPI
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
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

/**
 * High-level API for fetching comprehensive user context
 * Uses single GraphQL query to minimize roundtrips, with REST fallback
 */
export class UserContextAPI {
  private organizationsAPI: OrganizationsAPI;
  private locationsAPI: LocationsAPI;
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.organizationsAPI = new OrganizationsAPI(client);
    this.locationsAPI = new LocationsAPI(client);
    this.graphqlClient = createGraphQLClient(client);
  }

  /**
   * Execute GraphQL query for comprehensive user context
   * Single query to fetch user + organizations + locations
   */
  private async executeUserContextGraphQL(): Promise<GraphQLUserContextResponse> {
    const query = `
      query UserContext {
        currentUser {
          id
          login
          firstname
          lastname
          email
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

    return await this.graphqlClient.query<GraphQLUserContextResponse['data']>(query);
  }

  /**
   * Convert GraphQL user data to internal User type
   */
  private convertGraphQLToUser(node: NonNullable<GraphQLUserContextResponse['data']>['currentUser']): User {
    if (!node) {
      throw new Error('No user data in GraphQL response');
    }

    return {
      id: parseGraphQLId(node.id),
      login: node.login,
      firstname: node.firstname || '',
      lastname: node.lastname || '',
      mail: node.email || '',
      admin: false, // GraphQL doesn't expose admin status for security
      disabled: false, // Assume enabled if accessing API
      auth_source_id: 1, // Default internal auth source
      roles: [], // Would need separate query for roles
      organizations: [], // Will be filled separately
      locations: [], // Will be filled separately
    };
  }

  /**
   * Convert GraphQL organization data to internal Organization type
   */
  private convertGraphQLToOrganization(node: {
    id: string;
    name: string;
    title?: string;
    description?: string;
    ancestry?: string;
    label?: string;
  }): Organization {
    return {
      id: parseGraphQLId(node.id),
      name: node.name || '',
      title: node.title || node.name || '',
      description: node.description || '',
      ancestry: node.ancestry || undefined,
      label: node.label || undefined,
    };
  }

  /**
   * Convert GraphQL location data to internal Location type
   */
  private convertGraphQLToLocation(node: {
    id: string;
    name: string;
    title?: string;
    description?: string;
    ancestry?: string;
  }): Location {
    return {
      id: parseGraphQLId(node.id),
      name: node.name || '',
      title: node.title || node.name || '',
      description: node.description || '',
      ancestry: node.ancestry || undefined,
    };
  }

  /**
   * Fetch comprehensive user context data using single optimized GraphQL query
   * Falls back to multiple REST calls if GraphQL is not available
   */
  async getUserContext(): Promise<UserContextData> {
    try {
      // Try GraphQL first - single query for everything
      const response = await this.executeUserContextGraphQL();

      if (response.data?.currentUser) {
        const user = this.convertGraphQLToUser(response.data.currentUser);
        
        const organizations = response.data.currentUser.organizations?.edges?.map(edge =>
          this.convertGraphQLToOrganization(edge.node)
        ) || [];

        const locations = response.data.currentUser.locations?.edges?.map(edge =>
          this.convertGraphQLToLocation(edge.node)
        ) || [];

        return {
          user,
          organizations,
          locations,
        };
      }

      if (this.graphqlClient.hasErrors(response)) {
        console.warn('GraphQL errors for user context:', this.graphqlClient.getFormattedErrors(response));
      }

      // Fall through to REST fallback
    } catch (error) {
      console.warn('GraphQL user context failed, falling back to REST API:', error);
    }

    // REST API fallback - multiple requests
    return this.getUserContextRest();
  }

  /**
   * REST API fallback for user context
   * Makes separate calls when GraphQL is not available
   */
  private async getUserContextRest(): Promise<UserContextData> {
    try {
      // Fetch user data first
      const userResponse = await this.client.get<User>('/current_user');

      if (!userResponse) {
        return {
          user: null,
          organizations: [],
          locations: [],
        };
      }

      // Use the dedicated APIs which handle their own GraphQL/REST optimization
      const [orgsResponse, locsResponse] = await Promise.all([
        this.organizationsAPI.getUserOrganizations(),
        this.locationsAPI.getUserLocations(),
      ]);

      return {
        user: userResponse,
        organizations: orgsResponse,
        locations: locsResponse,
      };
    } catch (error) {
      console.error('Failed to fetch user context via REST:', error);
      throw error;
    }
  }

  /**
   * Fetch only user's accessible organizations
   * Useful for taxonomy context switching
   */
  async getUserOrganizations(): Promise<Organization[]> {
    return this.organizationsAPI.getUserOrganizations();
  }

  /**
   * Fetch only user's accessible locations  
   * Useful for taxonomy context switching
   */
  async getUserLocations(): Promise<Location[]> {
    return this.locationsAPI.getUserLocations();
  }
}