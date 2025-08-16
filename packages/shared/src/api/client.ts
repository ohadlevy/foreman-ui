import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError, BulkOperationResult } from '../types';
import { validateBulkOperationResult } from '../utils/bulkOperationUtils';

export interface ForemanClientConfig {
  baseURL: string;
  token?: string;
  username?: string;
  password?: string;
  timeout?: number;
}

export class ForemanAPIClient {
  private client: AxiosInstance;
  private token?: string;
  public baseURL: string;
  private isLoggingOut: boolean = false;

  constructor(config: ForemanClientConfig) {
    this.token = config.token;
    this.baseURL = config.baseURL;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Indicates this is an AJAX/API request
    };

    // Set up basic auth if username/password provided
    let auth: { username: string; password: string } | undefined;
    if (config.username && config.password) {
      auth = {
        username: config.username,
        password: config.password
      };
    }

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers,
      auth,
      withCredentials: false, // Disable cookies to prevent session-based auth bypass
    });

    this.setupInterceptors();
  }


  private setupInterceptors() {
    // Request interceptor for authentication and token handling
    this.client.interceptors.request.use(
      (config) => {
        // Add Bearer token if available (for Personal Access Tokens)
        // Or Basic token if it's base64-encoded credentials
        if (this.token) {
          // Check if this is a base64-encoded username:password (from login)
          // or a proper Personal Access Token
          try {
            const decoded = atob(this.token);
            if (decoded.includes(':')) {
              // This is base64-encoded username:password - use Basic auth
              config.headers.Authorization = `Basic ${this.token}`;
            } else {
              // This is a Personal Access Token - use Bearer auth
              config.headers.Authorization = `Bearer ${this.token}`;
            }
          } catch {
            // If atob fails, assume it's a Personal Access Token
            config.headers.Authorization = `Bearer ${this.token}`;
          }
        }

        // Making API request
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Check if this is a login/auth verification request
          const url = error.config?.url || '';
          const isAuthRequest = url.includes('/current_user') || url.includes('/login');
          const isNotificationRequest = url.includes('/notification_recipients');
          

          if (isNotificationRequest) {
            // This is a notification authentication failure - don't trigger global logout
            // Log the failure for debugging but let the notification system handle it gracefully
            console.warn('Notification authentication failed - likely expired session cookies interfering with PAT auth. Continuing with main app authentication.');
            // Don't clear token or redirect - just let the notification hook handle the error
            return Promise.reject(error);
          } else if (isAuthRequest) {
            // This is an authentication failure - clear token and redirect to login
            this.clearToken();
            if (!this.isLoggingOut && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          } else {
            // This is likely a session expiry during normal operations
            // Session expired during request
            this.clearToken();
            // Show session expiry message and redirect
            if (!this.isLoggingOut && window.location.pathname !== '/login') {
              // Try to use a better notification if available, fallback to alert
              if (window.postMessage) {
                window.postMessage({
                  type: 'SESSION_EXPIRED',
                  message: 'Your session has expired. Please log in again.'
                }, '*');
              } else {
                alert('Your session has expired. Please log in again.');
              }
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = undefined;
    localStorage.removeItem('foreman_auth_token');
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Specialized PUT method for bulk operations
   */
  private async putBulkOperation(
    url: string, 
    data: { included: { ids: number[] } } & Record<string, unknown>
  ): Promise<BulkOperationResult> {
    const response = await this.client.put(url, data);
    const requestedItemCount = data.included.ids.length;
    return validateBulkOperationResult(response.data, requestedItemCount);
  }

  /**
   * Specialized DELETE method for bulk operations
   */
  private async deleteBulkOperation(
    url: string, 
    data: { data: { included: { ids: number[] } } & Record<string, unknown> }
  ): Promise<BulkOperationResult> {
    const response = await this.client.delete(url, data);
    const requestedItemCount = data.data.included.ids.length;
    return validateBulkOperationResult(response.data, requestedItemCount);
  }


  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Control logout state to prevent redirects during token revocation
  setLoggingOut(isLoggingOut: boolean): void {
    this.isLoggingOut = isLoggingOut;
  }

  // Helper method for paginated endpoints
  async getPaginated<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.get<ApiResponse<T>>(url, { params });
  }

  // Helper method to handle Foreman API errors
  handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error) && error.response) {
      return {
        error: {
          message: error.response.data?.error?.message || error.message,
          details: error.response.data?.error?.details,
        },
      };
    }

    return {
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
    };
  }

  // Bulk operations methods
  async bulkUpdateHostgroup(hostIds: number[], hostgroupId: number): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/bulk/reassign_hostgroup', {
      included: {
        ids: hostIds,
      },
      excluded: {},
      hostgroup_id: hostgroupId,
    });
  }

  async bulkUpdateEnvironment(hostIds: number[], environmentId: number): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/bulk/reassign_environment', {
      included: {
        ids: hostIds,
      },
      excluded: {},
      environment_id: environmentId,
    });
  }

  async bulkUpdateOwner(hostIds: number[], ownerId: number, ownerType: string = 'User'): Promise<BulkOperationResult> {
    // Owner type mapping for Foreman API formatting
    // Foreman expects owner_id in format: "${id}-[OwnerTypeMap[type]]"
    const ownerTypeMap: Record<string, string> = {
      'User': 'Users',
      'Usergroup': 'Usergroups',
      // Add future owner types here as needed
    };
    
    const mappedOwnerType = ownerTypeMap[ownerType];
    if (!mappedOwnerType) {
      const supportedTypes = Object.keys(ownerTypeMap).join(', ');
      throw new Error(`Unknown owner type: "${ownerType}". Supported types: ${supportedTypes}`);
    }
    
    // Format owner_id according to Foreman API requirement
    const formattedOwnerId = `${ownerId}-${mappedOwnerType}`;
    
    return this.putBulkOperation('/hosts/bulk/change_owner', {
      included: {
        ids: hostIds,
      },
      excluded: {},
      owner_id: formattedOwnerId,
    });
  }

  async bulkUpdateOrganization(hostIds: number[], organizationId: number): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/bulk/assign_organization', {
      included: {
        ids: hostIds,
      },
      excluded: {},
      id: organizationId,
      mismatch_setting: true,
    });
  }

  async bulkUpdateLocation(hostIds: number[], locationId: number): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/bulk/assign_location', {
      included: {
        ids: hostIds,
      },
      excluded: {},
      id: locationId,
      mismatch_setting: true,
    });
  }


  async bulkChangeGroup(hostIds: number[], groupName: string): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/multiple_change_group', {
      included: {
        ids: hostIds,
      },
      excluded: {},
      group: groupName,
    });
  }

  async bulkBuild(hostIds: number[]): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/bulk/build', {
      included: {
        ids: hostIds,
      },
      excluded: {},
    });
  }

  async bulkDestroy(hostIds: number[]): Promise<BulkOperationResult> {
    // Use DELETE method as per Foreman's actual API route:
    // match 'hosts/bulk', :to => 'hosts_bulk_actions#bulk_destroy', :via => [:delete]
    return this.deleteBulkOperation('/hosts/bulk', {
      data: {
        included: {
          ids: hostIds,
        },
        excluded: {},
      },
    });
  }

  async bulkDisown(hostIds: number[]): Promise<BulkOperationResult> {
    return this.putBulkOperation('/hosts/bulk/disassociate', {
      included: {
        ids: hostIds,
      },
      excluded: {},
    });
  }

}

// Default client instance
export const createForemanClient = (config: ForemanClientConfig) => {
  return new ForemanAPIClient(config);
};

// Singleton client instance
let defaultClientInstance: ForemanAPIClient | null = null;
let lastToken: string | undefined = undefined;

// Environment-based client creation
export const createDefaultClient = () => {
  // Temporary: Force use of proxy path for testing
  const baseURL = process.env.REACT_APP_API_URL || '/api/v2';
  const token = localStorage.getItem('foreman_auth_token') || undefined;


  // Only create a new client if one doesn't exist or if the baseURL has changed
  if (!defaultClientInstance || defaultClientInstance.baseURL !== baseURL) {
    // Creating API client without token initially
    defaultClientInstance = createForemanClient({ baseURL });

    // Set token if available
    if (token) {
      defaultClientInstance.setToken(token);
    }
    lastToken = token;
  } else {
    // Update the token if it has changed
    if (token !== lastToken) {
      if (token) {
        defaultClientInstance.setToken(token);
      } else {
        defaultClientInstance.clearToken();
      }
      lastToken = token;
    }
  }

  return defaultClientInstance;
};

// Reset the singleton (useful for logout or testing)
export const resetDefaultClient = () => {
  defaultClientInstance = null;
  lastToken = undefined;
};