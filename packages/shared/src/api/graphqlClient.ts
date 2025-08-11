import { ForemanAPIClient, createForemanClient } from './client';

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
  private client: ForemanAPIClient;

  constructor(baseClient: ForemanAPIClient) {
    // Create a separate client for GraphQL with correct baseURL, like notifications does
    const token = baseClient.getToken();
    this.client = createForemanClient({
      baseURL: '/api', // GraphQL is at /api/graphql, not /api/v2/graphql  
      token: token || undefined,
    });
  }

  /**
   * Execute a GraphQL query with proper authentication and error handling
   */
  async query<T = unknown>(
    query: string,
    variables?: GraphQLVariables
  ): Promise<GraphQLResponse<T>> {
    try {
      // Prepare request body
      const body: { query: string; variables?: GraphQLVariables } = { query };
      if (variables) {
        body.variables = variables;
      }

      // Use the GraphQL-specific client with baseURL '/api'
      const result = await this.client.post<GraphQLResponse<T>>('/graphql', body);

      // Log GraphQL errors for debugging but don't throw - let caller handle
      if (result.errors?.length) {
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
    return !!(response.errors?.length);
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