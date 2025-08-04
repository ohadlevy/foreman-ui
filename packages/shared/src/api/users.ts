import { ForemanAPIClient } from './client';
import { User, UserFormData, SearchParams, ApiResponse } from '../types';
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

export class UsersAPI {
  // Minimum viable base64 string length (4 chars can represent up to 3 bytes)
  private static readonly MIN_BASE64_ID_LENGTH = 4;

  // Cached regex for base64 validation to improve performance
  private static readonly BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  constructor(private client: ForemanAPIClient) {}

  private isValidBase64(str: string): boolean {
    try {
      // Use cached regex for performance
      if (!UsersAPI.BASE64_REGEX.test(str)) {
        return false;
      }
      // Check length is multiple of 4
      if (str.length % 4 !== 0) {
        return false;
      }
      // If regex and length checks pass, consider valid base64
      return true;
    } catch {
      return false;
    }
  }

  private parseUserIdFromGraphQL(rawId: string): number {
    try {
      // Check length first (faster), then validate base64 format
      if (rawId.length > UsersAPI.MIN_BASE64_ID_LENGTH && this.isValidBase64(rawId)) {
        const decodedId = atob(rawId);

        // Extract numeric part from strings like "User-5", "gid://User/5", or "MDEwOlJlcG9zaXRvcnk1"
        const numericMatch = decodedId.match(/(\d+)$/);
        if (numericMatch) {
          return parseInt(numericMatch[1], 10);
        } else {
          throw new Error(`Could not extract numeric ID from decoded string: "${decodedId}". Expected format: "User-<id>", "gid://User/<id>", or similar.`);
        }
      } else {
        // Direct numeric ID
        return parseInt(rawId, 10);
      }
    } catch (error) {
      console.warn('Failed to parse GraphQL user ID. Expected a numeric ID or base64-encoded string containing a numeric ID.', error);
      // Last resort: try direct parsing
      const numericUserId = parseInt(rawId, 10);
      if (isNaN(numericUserId)) {
        throw new Error('Invalid user ID format. Expected a numeric ID or base64-encoded string containing a numeric ID.');
      }
      return numericUserId;
    }
  }


  async list(params?: SearchParams): Promise<ApiResponse<User>> {
    return this.client.getPaginated<User>(API_ENDPOINTS.USERS, params);
  }

  async get(id: number): Promise<User> {
    return this.client.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
  }

  private async executeGraphQLQuery(query: string): Promise<{ data?: { currentUser?: Record<string, unknown> }; errors?: GraphQLError[] }> {
    const token = this.client.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Configure authentication for GraphQL
    if (token) {
      // Enhanced token format validation before processing
      if (!token.trim() || token.length < 4) {
        throw new Error('Authentication failed');
      }

      // Validate if token is base64-encoded credentials (username:password)
      let decoded: string | null = null;
      let isBase64Credential = false;

      if (this.isValidBase64(token)) {
        try {
          decoded = atob(token);
          // More specific credential validation - check for typical username:password format
          if (decoded && typeof decoded === 'string' && /^[a-zA-Z0-9._-]+:[^:]*$/.test(decoded)) {
            isBase64Credential = true;
          }
        } catch {
          // Should not happen if base64 is valid, but handle just in case
          console.warn('Authentication token validation failed.');
          decoded = null;
        }
      } else {
        // Validate raw token format
        if (!token.trim() || token.includes(' ') || token.includes('\n') || token.includes('\t')) {
          throw new Error('Authentication failed');
        }
        decoded = null;
      }

      if (isBase64Credential && decoded) {
        // Token is already base64-encoded credentials
        headers.Authorization = `Basic ${token}`;
      } else {
        // More specific validation for raw username:password pairs
        if (/^[a-zA-Z0-9._-]+:[^:]*$/.test(token)) {
          // This looks like raw username:password - should be base64 encoded
          throw new Error('Authentication failed');
        }
        // Token is likely a PAT or API key, encode as username with empty password
        headers.Authorization = `Basic ${btoa(token + ':')}`;
      }
    }

    const response = await fetch(API_ENDPOINTS.GRAPHQL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.status}`);
    }

    try {
      return await response.json();
    } catch (jsonError) {
      throw new Error(`Failed to parse JSON response from GraphQL: ${jsonError}`);
    }
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

      const graphqlResponse = await this.executeGraphQLQuery(query);

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