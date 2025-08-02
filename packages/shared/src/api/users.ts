import { ForemanAPIClient } from './client';
import { User, UserFormData, SearchParams, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export class UsersAPI {
  constructor(private client: ForemanAPIClient) {}

  async list(params?: SearchParams): Promise<ApiResponse<User>> {
    return this.client.getPaginated<User>(API_ENDPOINTS.USERS, params);
  }

  async get(id: number): Promise<User> {
    return this.client.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
  }

  async getCurrent(): Promise<User> {
    // Use the Foreman API v2 current user endpoint
    try {
      const userResponse = await this.client.get<User>('/current_user');
      
      // Return the actual user data from the API response
      return {
        id: userResponse.id,
        login: userResponse.login,
        firstname: userResponse.firstname || '',
        lastname: userResponse.lastname || '',
        mail: userResponse.mail || '',
        admin: userResponse.admin || false,
        disabled: userResponse.disabled || false,
        last_login_on: userResponse.last_login_on || new Date().toISOString(),
        auth_source_id: userResponse.auth_source_id,
        roles: userResponse.roles || [],
        organizations: userResponse.organizations || [],
        locations: userResponse.locations || []
      } as User;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
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