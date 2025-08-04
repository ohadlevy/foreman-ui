import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '../types';

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

          if (isAuthRequest) {
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