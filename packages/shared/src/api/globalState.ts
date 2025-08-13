import { createGraphQLClient, GraphQLClient } from './graphqlClient';
import { ForemanAPIClient } from './client';
import { parseGraphQLId } from '../utils/graphql';
import { SYSTEM_IDENTIFIERS, TAXONOMY_DEFAULT_VALUES } from '../constants';
import type { User } from '../types';
import type { EnhancedOrganization, EnhancedLocation } from '../types/taxonomy';

// Using constants for default values when data is not available in GraphQL

/**
 * Global application state data structure
 * This consolidates all essential app data in one place
 */
export interface GlobalAppState {
  currentUser: User;
  organizations: EnhancedOrganization[];
  locations: EnhancedLocation[];
}

/**
 * GraphQL response structure for global state query
 */
interface GlobalStateGraphQLData {
  currentUser: {
    id: string;
    login: string;
    firstname: string;
    lastname: string;
    mail: string;
    admin: boolean;
    fullname: string;
    locale: string;
    timezone: string;
    description: string;
    lastLoginOn: string;
    defaultLocation?: {
      id: string;
      name: string;
    };
    defaultOrganization?: {
      id: string;
      name: string;
    };
    usergroups: {
      edges: Array<{
        node: {
          id: string;
          name: string;
        };
      }>;
    };
    permissions: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          resourceType: string;
        };
      }>;
    };
  };
  organizations: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        title?: string;
      };
    }>;
  };
  locations: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        title?: string;
      };
    }>;
  };
}

/**
 * Global State API for fetching all essential app data in one query
 * Replaces multiple separate API calls with one optimized GraphQL request
 */
export class GlobalStateAPI {
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.graphqlClient = createGraphQLClient(client);
  }

  /**
   * Fetch all essential application state in a single GraphQL query
   * 
   * This consolidates:
   * - currentUser (with default org/location references + permissions)
   * - organizations (full list for selectors)
   * - locations (full list for selectors)
   * 
   * Replaces these separate API calls:
   * - UsersAPI.getCurrent() 
   * - OrganizationsAPI.list()
   * - LocationsAPI.list()
   */
  async getGlobalState(): Promise<GlobalAppState> {
    try {
      const query = `
        query GlobalApplicationState {
          currentUser {
            id
            login
            firstname
            lastname
            mail
            admin
            fullname
            locale
            timezone
            description
            lastLoginOn
            defaultLocation {
              id
              name
            }
            defaultOrganization {
              id
              name
            }
            usergroups {
              edges {
                node {
                  id
                  name
                }
              }
            }
            permissions {
              edges {
                node {
                  id
                  name
                  resourceType
                }
              }
            }
          }
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

      const response = await this.graphqlClient.query<GlobalStateGraphQLData>(query);

      if (!response.data?.currentUser) {
        throw new Error('Failed to fetch current user data');
      }

      const userData = response.data.currentUser;

      // Convert GraphQL permissions from Connection format
      const permissions = userData.permissions?.edges?.map(edge => ({
        id: parseGraphQLId(edge.node.id),
        name: edge.node.name,
        resource_type: edge.node.resourceType || '',
      })) || [];


      // Convert user data (following same pattern as UsersAPI.getCurrent())
      const currentUser: User = {
        id: parseGraphQLId(userData.id),
        login: userData.login,
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        mail: userData.mail || '',
        admin: userData.admin || false,
        disabled: false, // Not available in GraphQL, default to false
        last_login_on: userData.lastLoginOn || undefined,
        auth_source_id: SYSTEM_IDENTIFIERS.DEFAULT_AUTH_SOURCE_ID, // Not available in GraphQL, default value
        roles: permissions.length > 0 ? [{
          id: SYSTEM_IDENTIFIERS.COMBINED_PERMISSIONS_ROLE_ID,
          name: SYSTEM_IDENTIFIERS.COMBINED_PERMISSIONS_ROLE_NAME,
          description: 'Combined permissions from GraphQL',
          origin: 'graphql' as const,
          permissions: permissions,
          builtin: false
        }] : [],
        organizations: userData.defaultOrganization ? [{
          id: parseGraphQLId(userData.defaultOrganization.id),
          name: userData.defaultOrganization.name,
        }] : [],
        locations: userData.defaultLocation ? [{
          id: parseGraphQLId(userData.defaultLocation.id),
          name: userData.defaultLocation.name,
        }] : []
      };

      // Convert organizations (full list for selectors)
      const organizations: EnhancedOrganization[] = response.data.organizations?.edges?.map(edge => ({
        id: parseGraphQLId(edge.node.id),
        name: edge.node.name,
        title: edge.node.title || edge.node.name,
        description: TAXONOMY_DEFAULT_VALUES.DESCRIPTION, // Not available in GraphQL schema
        hosts_count: TAXONOMY_DEFAULT_VALUES.HOSTS_COUNT, // Not fetched for performance
        users_count: TAXONOMY_DEFAULT_VALUES.USERS_COUNT, // Not fetched for performance
        created_at: TAXONOMY_DEFAULT_VALUES.CREATED_AT, // Not available in GraphQL
        updated_at: TAXONOMY_DEFAULT_VALUES.UPDATED_AT, // Not available in GraphQL
      })) || [];

      // Convert locations (full list for selectors)
      const locations: EnhancedLocation[] = response.data.locations?.edges?.map(edge => ({
        id: parseGraphQLId(edge.node.id),
        name: edge.node.name,
        title: edge.node.title || edge.node.name,
        description: TAXONOMY_DEFAULT_VALUES.DESCRIPTION, // Not available in GraphQL schema
        hosts_count: TAXONOMY_DEFAULT_VALUES.HOSTS_COUNT, // Not fetched for performance
        users_count: TAXONOMY_DEFAULT_VALUES.USERS_COUNT, // Not fetched for performance
        created_at: TAXONOMY_DEFAULT_VALUES.CREATED_AT, // Not available in GraphQL
        updated_at: TAXONOMY_DEFAULT_VALUES.UPDATED_AT, // Not available in GraphQL
      })) || [];

      return {
        currentUser,
        organizations,
        locations
      };

    } catch (error) {
      console.error('GlobalState GraphQL query failed:', error);
      throw error;
    }
  }

  /**
   * Fallback method that uses individual REST API calls
   * Used when GraphQL is unavailable or fails
   */
  async getGlobalStateFallback(): Promise<GlobalAppState> {
    // Import APIs here to avoid circular dependencies
    const { UsersAPI } = await import('./users');
    const { TaxonomyAPI } = await import('./taxonomy');

    const usersAPI = new UsersAPI(this.client);
    const taxonomyAPI = new TaxonomyAPI(this.client);

    // Fetch data in parallel using existing REST APIs
    const [currentUser, taxonomyData] = await Promise.all([
      usersAPI.getCurrent(),
      taxonomyAPI.getAll()
    ]);

    return {
      currentUser,
      organizations: taxonomyData.organizations.results,
      locations: taxonomyData.locations.results
    };
  }
}

/**
 * Factory function to create a GlobalStateAPI instance
 */
export function createGlobalStateAPI(client: ForemanAPIClient): GlobalStateAPI {
  return new GlobalStateAPI(client);
}