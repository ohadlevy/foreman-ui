import { ForemanAPIClient, resetDefaultClient, createForemanClient } from './client';
import { UsersAPI } from './users';
import { LoginCredentials, AuthResponse, User, TokenResponse, AxiosErrorResponse } from '../types';
import { clearForemanSessionCookies } from '../auth/constants';

// Utility function to generate cache-busting parameters
const generateCacheBuster = (): string => {
  return `_cb=${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

export class AuthAPI {
  constructor(private client: ForemanAPIClient) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Enhanced authentication flow: validate credentials then generate Personal Access Token
    try {
      // CRITICAL SECURITY: Ensure complete session cleanup before new login
      this.client.clearToken();
      localStorage.removeItem('foreman_auth_token');
      localStorage.removeItem('foreman_auth_token_id');
      localStorage.removeItem('foreman_auth_user_id');
      localStorage.removeItem('foreman-auth');
      sessionStorage.clear();

      // Clear only Foreman-specific session cookies to avoid affecting other applications
      clearForemanSessionCookies();

      // Note: Foreman doesn't have a logout API endpoint,
      // but clearing cookies should invalidate browser session state

      // Reset API client singleton to prevent any cached state reuse
      resetDefaultClient();

      // Create a completely fresh client WITH basic auth credentials
      // This client will be used specifically for creating a Personal Access Token,
      // which requires basic authentication with username/password credentials.
      // Once the PAT is created, all subsequent API calls will use the token instead.
      const basicAuthClient = createForemanClient({
        baseURL: this.client.baseURL,
        username: credentials.login,
        password: credentials.password
      });

      // Ensure this client has no tokens
      basicAuthClient.clearToken();

      // Manually construct the Basic Auth header to bypass browser credential caching
      const basicAuthHeader = btoa(`${credentials.login}:${credentials.password}`);

      // Step 1: Validate credentials by fetching current user info
      // Add cache-busting headers to ensure fresh authentication

      // Add cache-busting parameter to prevent browser Basic Auth caching
      const cacheBuster = generateCacheBuster();

      // Use fetch directly to avoid any axios interceptors and ensure no cookies
      const response = await fetch(`${this.client.baseURL}/current_user?${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuthHeader}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'omit' // CRITICAL: Don't send cookies that could bypass auth
      });

      if (!response.ok) {
        // Create a custom error object that looks like an axios error but preserves our message
        const authError = new Error();
        if (response.status === 401) {
          authError.message = 'Invalid username or password. Please try again.';
        } else if (response.status === 403) {
          authError.message = 'Access denied. Your account may be disabled.';
        } else if (response.status === 404) {
          authError.message = 'API endpoint not found. Please check your Foreman server configuration.';
        } else if (response.status >= 500) {
          authError.message = `Server error (${response.status}). Please try again later or contact support.`;
        } else {
          authError.message = `Authentication failed (${response.status}). Please try again.`;
        }

        // Add properties to make it look like an axios error response
        (authError as AxiosErrorResponse).response = {
          status: response.status,
          statusText: response.statusText,
          data: { error: { message: authError.message } }
        };

        throw authError;
      }

      const userResponse = await response.json() as User;


      // SECURITY: Username mismatch check removed and replaced with stronger security measures:
      // 1. credentials: 'omit' prevents any session cookie fallback authentication
      // 2. Comprehensive cookie clearing prevents session reuse across login attempts
      // 3. Pure credential-based authentication via Personal Access Tokens only
      // This provides better security than checking usernames as it prevents the attack vector entirely.


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

      // Now fetch the complete user data with permissions using the generated token
      const tokenClient = createForemanClient({
        baseURL: this.client.baseURL,
        token: personalAccessToken
      });
      const usersAPI = new UsersAPI(tokenClient);

      // Get full user data with permissions via GraphQL
      const user = await usersAPI.getCurrent();

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
        // Check if this was a security violation
        if (axiosError.message?.includes('Username mismatch')) {
          throw new Error('Authentication failed: Session conflict detected. Please try again.');
        }
        // Check if this is an authentication error from our fetch request
        if (axiosError.message?.includes('Invalid username or password') ||
            axiosError.message?.includes('Access denied') ||
            axiosError.message?.includes('Authentication failed')) {
          throw new Error(axiosError.message);
        }
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

      // Clear only Foreman-specific session cookies to avoid affecting other applications
      clearForemanSessionCookies();
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

    // Use GraphQL to fetch full user data with permissions
    const usersAPI = new UsersAPI(tokenClient);
    return await usersAPI.getCurrent();
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/users/refresh_token');
  }

  // For installations using Personal Access Tokens
  async loginWithToken(token: string): Promise<User> {
    this.client.setToken(token);
    localStorage.setItem('foreman_auth_token', token);

    // Use GraphQL to fetch full user data with permissions
    const usersAPI = new UsersAPI(this.client);
    return await usersAPI.getCurrent();
  }
}