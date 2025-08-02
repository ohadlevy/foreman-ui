import { ForemanAPIClient } from './client';
import { LoginCredentials, AuthResponse, User, TokenResponse, AxiosErrorResponse } from '../types';

export class AuthAPI {
  constructor(private client: ForemanAPIClient) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Enhanced authentication flow: validate credentials then generate Personal Access Token
    try {
      // First, ensure we clear any existing session state
      this.client.clearToken();
      localStorage.removeItem('foreman_auth_token');
      sessionStorage.clear();
      
      // Create a temporary client with basic auth for credential validation
      const basicAuthClient = new ForemanAPIClient({
        baseURL: this.client.baseURL,
        username: credentials.login,
        password: credentials.password
      });
      
      // Step 1: Validate credentials by fetching current user info
      const userResponse = await basicAuthClient.get<User>('/current_user');
      
      // CRITICAL: Verify that the authenticated user matches the requested username
      if (userResponse.login !== credentials.login) {
        console.error('🚨 SECURITY VIOLATION: Username mismatch!', {
          requested: credentials.login,
          authenticated: userResponse.login
        });
        throw new Error(`Authentication failed: Username mismatch. This may indicate a server security issue.`);
      }
      
      
      // Step 2: Generate a Personal Access Token for secure API access
      // Use the user-scoped endpoint: /api/v2/users/:user_id/personal_access_tokens
      const tokenData = await basicAuthClient.post(`/users/${userResponse.id}/personal_access_tokens`, {
        personal_access_token: {
          name: `Foreman UI - ${new Date().toISOString()}`,
          scopes: ['default'], // Use default scopes or customize as needed
          expires_at: null // No expiration, or set a future date
        }
      });
      
      // Extract the generated token - Foreman returns 'token_value' field
      const tokenResponse = tokenData as TokenResponse;
      const personalAccessToken = tokenResponse.token_value || 
                                 tokenResponse.token ||
                                 tokenResponse.personal_access_token?.token_value ||
                                 tokenResponse.personal_access_token?.token ||
                                 tokenResponse.data?.token_value ||
                                 tokenResponse.data?.token;
                                 
      if (!personalAccessToken) {
        console.error('Failed to extract token from response:', tokenData);
        throw new Error(`Failed to generate authentication token. Response structure: ${JSON.stringify(tokenData)}`);
      }
      
      
      // Store the token immediately for logout purposes
      localStorage.setItem('foreman_auth_token', personalAccessToken);
      // Also store token metadata for easier revocation
      localStorage.setItem('foreman_auth_token_id', tokenResponse.id.toString());
      localStorage.setItem('foreman_auth_user_id', userResponse.id.toString());
      
      // Use the actual user data from the API response
      const user: User = {
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
      };
      
      // Return the user data with the generated Personal Access Token
      const authData = {
        user,
        token: personalAccessToken // Real Foreman Personal Access Token
      };
      
      return authData;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      console.error('Authentication error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        url: axiosError.config?.url,
        method: axiosError.config?.method
      });
      
      // Provide better error messages based on response status
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid username or password. Please try again.');
      } else if (axiosError.response?.status === 403) {
        throw new Error('Access denied. Your account may be disabled.');
      } else if (axiosError.response?.status === 404) {
        throw new Error('API endpoint not found. Please check your Foreman server configuration.');
      } else if (axiosError.response?.status === 422) {
        const details = axiosError.response?.data?.error?.full_messages?.join(', ') || 'Validation error';
        throw new Error(`Invalid request: ${details}`);
      } else if (axiosError.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new Error(`Server error (${axiosError.response.status}). Please try again later or contact support.`);
      } else if (axiosError.code === 'NETWORK_ERROR' || !axiosError.response) {
        throw new Error('Network error. Please check your connection and Foreman server URL.');
      } else {
        const serverMessage = axiosError.response?.data?.error?.message;
        throw new Error(serverMessage || `Login failed (${axiosError.response?.status}). Please try again.`);
      }
    }
  }

  async logout(): Promise<void> {
    // Set logout flag to prevent redirects during token revocation
    this.client.setLoggingOut(true);
    
    try {
      // Get the current token and metadata to revoke it
      const token = localStorage.getItem('foreman_auth_token');
      const tokenId = localStorage.getItem('foreman_auth_token_id');
      const userId = localStorage.getItem('foreman_auth_user_id');
      
      
      if (token && tokenId && userId) {
        try {
          // Use stored metadata for direct token revocation
          await this.client.delete(`/users/${userId}/personal_access_tokens/${tokenId}`);
        } catch {
          // Fallback: Search for token in user's token list
          try {
            const tokensResponse = await this.client.get(`/users/${userId}/personal_access_tokens`);
            
            const tokensData = tokensResponse as { results?: TokenResponse[] };
            const currentTokenData = tokensData.results?.find((t: TokenResponse) => 
              t.token_value === token || t.token === token || t.name?.includes('Foreman UI')
            );
            
            if (currentTokenData) {
              await this.client.delete(`/users/${userId}/personal_access_tokens/${currentTokenData.id}`);
            }
          } catch (fallbackError) {
            console.error('Token revocation failed:', fallbackError);
          }
        }
      } else if (token) {
        // Try to get current user and search for token
        try {
          const currentUser = await this.client.get('/current_user');
          const userData = currentUser as User;
          const currentUserId = userData.id;
          
          if (currentUserId) {
            const tokensResponse = await this.client.get(`/users/${currentUserId}/personal_access_tokens`);
            const tokensData = tokensResponse as { results?: TokenResponse[] };
            const currentTokenData = tokensData.results?.find((t: TokenResponse) => 
              t.token_value === token || t.token === token || t.name?.includes('Foreman UI')
            );
            
            if (currentTokenData) {
              await this.client.delete(`/users/${currentUserId}/personal_access_tokens/${currentTokenData.id}`);
            }
          }
        } catch (error) {
          console.error('Token revocation failed:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Silent fail on logout errors
    } finally {
      // Reset logout flag and clean up
      this.client.setLoggingOut(false);
      this.client.clearToken();
      localStorage.removeItem('foreman_auth_token');
      localStorage.removeItem('foreman_auth_token_id');
      localStorage.removeItem('foreman_auth_user_id');
      sessionStorage.clear();
    }
  }

  async verifyToken(): Promise<User> {
    // Verify the stored Personal Access Token
    const storedToken = localStorage.getItem('foreman_auth_token');
    if (!storedToken) {
      throw new Error('No stored token');
    }
    
    // Create client with the Personal Access Token
    const tokenClient = new ForemanAPIClient({
      baseURL: this.client.baseURL,
      token: storedToken
    });
    
    // Test if the stored token still works by calling /current_user
    const userResponse = await tokenClient.get<User>('/current_user');
    
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
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/users/refresh_token');
  }

  // For installations using Personal Access Tokens
  async loginWithToken(token: string): Promise<User> {
    this.client.setToken(token);
    localStorage.setItem('foreman_auth_token', token);
    
    // Verify token works by fetching current user info
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
  }
}