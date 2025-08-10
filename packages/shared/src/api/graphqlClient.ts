import { ForemanAPIClient } from './client';
import { API_ENDPOINTS } from '../constants';

/**
 * GraphQL error structure from Foreman GraphQL API
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

/**
 * Standard GraphQL response structure
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * GraphQL request variables
 */
export interface GraphQLVariables {
  [key: string]: unknown;
}

/**
 * Dedicated GraphQL client for Foreman API
 * Handles authentication, URL construction, and standardized error handling
 */
export class GraphQLClient {
  constructor(private client: ForemanAPIClient) {}

  /**
   * Execute a GraphQL query with proper authentication and error handling
   */
  async query<T = unknown>(
    query: string,
    variables?: GraphQLVariables
  ): Promise<GraphQLResponse<T>> {
    try {
      // Construct proper GraphQL URL by removing /api/v2 and adding /api/graphql
      const baseUrl = this.client.baseURL.replace('/api/v2', '');
      const graphqlUrl = baseUrl + API_ENDPOINTS.GRAPHQL;
      
      // Prepare request headers with authentication
      const token = this.client.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prepare request body
      const body: { query: string; variables?: GraphQLVariables } = { query };
      if (variables) {
        body.variables = variables;
      }

      // Execute GraphQL request
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      // Log GraphQL errors for debugging but don't throw - let caller handle
      if (result.errors && result.errors.length > 0) {
        console.warn('GraphQL query returned errors:', result.errors);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown GraphQL error';
      throw new Error(`GraphQL query failed: ${errorMessage}`);
    }
  }

  /**
   * Execute a GraphQL mutation with proper authentication and error handling
   */
  async mutate<T = unknown>(
    mutation: string,
    variables?: GraphQLVariables
  ): Promise<GraphQLResponse<T>> {
    // Mutations use the same transport as queries in GraphQL
    return this.query<T>(mutation, variables);
  }

  /**
   * Utility method to check if a GraphQL response has errors
   */
  hasErrors(response: GraphQLResponse): boolean {
    return !!(response.errors && response.errors.length > 0);
  }

  /**
   * Extract error messages from a GraphQL response
   */
  getErrorMessages(response: GraphQLResponse): string[] {
    if (!response.errors) return [];
    return response.errors.map(error => error.message);
  }

  /**
   * Get a formatted error string from GraphQL response
   */
  getFormattedErrors(response: GraphQLResponse): string {
    const messages = this.getErrorMessages(response);
    return messages.join(', ');
  }
}

/**
 * Factory function to create a GraphQL client instance
 */
export function createGraphQLClient(foremanClient: ForemanAPIClient): GraphQLClient {
  return new GraphQLClient(foremanClient);
}