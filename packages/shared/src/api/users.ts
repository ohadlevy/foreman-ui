import { ForemanAPIClient } from './client';
import { GraphQLClient, createGraphQLClient } from './graphqlClient';
import { User, UserFormData, SearchParams, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';
import { parseGraphQLId } from '../utils/graphql';

export class UsersAPI {
  private graphqlClient: GraphQLClient;

  constructor(private client: ForemanAPIClient) {
    this.graphqlClient = createGraphQLClient(client);
  }

  private parseUserIdFromGraphQL(rawId: string): number {
    return parseGraphQLId(rawId);
  }


  async list(params?: SearchParams): Promise<ApiResponse<User>> {
    return this.client.getPaginated<User>(API_ENDPOINTS.USERS, params);
  }

  async get(id: number): Promise<User> {
    return this.client.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
  }


  async getCurrent(): Promise<User> {
    // Try GraphQL first for efficient single-query data fetching
    try {
      const query = `
        query {
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
        }
      `;

      const graphqlResponse = await this.graphqlClient.query<{ currentUser?: Record<string, unknown> }>(query);

      if (graphqlResponse.data?.currentUser) {
        const userData = graphqlResponse.data.currentUser as Record<string, unknown>;

        // Convert GraphQL permissions from Connection format
        const permissionsData = userData.permissions as { edges?: Array<{ node: { id: string; name: string; resourceType?: string } }> } | undefined;

        const permissions = (permissionsData?.edges || []).map((edge) => ({
          id: parseInt(edge.node.id) || 0,
          name: edge.node.name,
          resource_type: edge.node.resourceType || ''
        }));

        // Create virtual role for all permissions
        const virtualRole = {
          id: -1,
          name: 'All Permissions',
          description: 'Combined permissions from GraphQL',
          origin: 'graphql' as const,
          permissions: permissions,
          builtin: false
        };

        // GraphQL returns base64-encoded IDs, need to extract numeric user ID
        const rawId = userData.id as string;
        const numericUserId = this.parseUserIdFromGraphQL(rawId);

        // Final validation to ensure we have a valid numeric user ID
        if (isNaN(numericUserId) || numericUserId <= 0) {
          console.warn(`Invalid user ID encountered: ${numericUserId}. User ID must be a positive integer.`);
          throw new Error('Invalid user ID format. User ID must be a positive integer.');
        }

        const result = {
          id: numericUserId,
          login: userData.login as string,
          firstname: (userData.firstname as string) || '',
          lastname: (userData.lastname as string) || '',
          mail: (userData.mail as string) || '',
          admin: (userData.admin as boolean) || false,
          disabled: false,
          last_login_on: (userData.lastLoginOn as string) || null,
          auth_source_id: 1,
          roles: permissions.length > 0 ? [virtualRole] : [],
          organizations: userData.defaultOrganization ? [userData.defaultOrganization] : [],
          locations: userData.defaultLocation ? [userData.defaultLocation] : []
        } as User;

        return result;
      }
    } catch (graphqlError) {
      console.warn('GraphQL failed, falling back to REST API:', graphqlError instanceof Error ? graphqlError.message : graphqlError);
    }

    // REST API fallback
    const userResponse = await this.client.get<User>('/current_user');
    return {
      id: userResponse.id,
      login: userResponse.login,
      firstname: userResponse.firstname || '',
      lastname: userResponse.lastname || '',
      mail: userResponse.mail || '',
      admin: userResponse.admin || false,
      disabled: userResponse.disabled || false,
      last_login_on: userResponse.last_login_on || null,
      auth_source_id: userResponse.auth_source_id,
      roles: userResponse.roles || [],
      organizations: userResponse.organizations || [],
      locations: userResponse.locations || []
    } as User;
  }

  async create(data: UserFormData): Promise<User> {
    return this.client.post<User>(API_ENDPOINTS.USERS, { user: data });
  }

  async update(id: number, data: Partial<UserFormData>): Promise<User> {
    return this.client.put<User>(`${API_ENDPOINTS.USERS}/${id}`, { user: data });
  }

  async updateCurrent(data: Partial<UserFormData>): Promise<User> {
    const currentUser = await this.getCurrent();
    return this.update(currentUser.id, data);
  }

  async delete(id: number): Promise<void> {
    return this.client.delete(`${API_ENDPOINTS.USERS}/${id}`);
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return this.client.put(`${API_ENDPOINTS.USERS}/${id}`, {
      user: {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      },
    });
  }
}