import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphQLClient, createGraphQLClient } from '../graphqlClient';
import { ForemanAPIClient, createForemanClient } from '../client';

// Mock the client module
vi.mock('../client', () => ({
  createForemanClient: vi.fn(),
  ForemanAPIClient: vi.fn(),
}));

describe('GraphQLClient', () => {
  let mockClient: ForemanAPIClient;
  let mockGraphQLClient: ForemanAPIClient;
  let graphqlClient: GraphQLClient;
  let mockCreateForemanClient: any;

  beforeEach(() => {
    mockClient = {
      baseURL: '/api/v2',
      getToken: vi.fn().mockReturnValue('test-token'),
      post: vi.fn(),
    } as any;

    mockGraphQLClient = {
      baseURL: '/api',
      post: vi.fn(),
    } as any;

    // Mock the createForemanClient function
    mockCreateForemanClient = vi.mocked(createForemanClient);
    mockCreateForemanClient.mockReturnValue(mockGraphQLClient);

    graphqlClient = createGraphQLClient(mockClient);
  });

  describe('URL construction', () => {
    it('should create GraphQL client with correct baseURL', () => {
      // Verify that createForemanClient was called with correct baseURL
      expect(mockCreateForemanClient).toHaveBeenCalledWith({
        baseURL: '/api',
        token: 'test-token',
      });
    });

    it('should use /graphql endpoint with GraphQL client', async () => {
      // Mock successful response
      (mockGraphQLClient.post as any).mockResolvedValue({
        data: { test: 'value' },
        errors: null
      });

      const query = 'query { test }';
      await graphqlClient.query(query);

      // Verify the correct URL is used - should be '/graphql' with baseURL '/api'
      expect(mockGraphQLClient.post).toHaveBeenCalledWith('/graphql', {
        query
      });
    });

    it('should not use the original client baseURL', async () => {
      (mockGraphQLClient.post as any).mockResolvedValue({
        data: { test: 'value' },
        errors: null
      });

      await graphqlClient.query('query { test }');

      // Original client should not be called at all
      expect(mockClient.post).not.toHaveBeenCalled();
      
      // GraphQL client should be called with correct path
      expect(mockGraphQLClient.post).toHaveBeenCalledWith('/graphql', expect.any(Object));
    });
  });

  describe('query execution', () => {
    it('should pass variables correctly', async () => {
      (mockGraphQLClient.post as any).mockResolvedValue({
        data: { test: 'value' },
        errors: null
      });

      const query = 'query($id: ID!) { user(id: $id) { name } }';
      const variables = { id: '123' };
      
      await graphqlClient.query(query, variables);

      expect(mockGraphQLClient.post).toHaveBeenCalledWith('/graphql', {
        query,
        variables
      });
    });

    it('should handle GraphQL errors correctly', async () => {
      const mockErrors = [{ message: 'Test error' }];
      (mockGraphQLClient.post as any).mockResolvedValue({
        data: null,
        errors: mockErrors
      });

      const result = await graphqlClient.query('query { test }');

      expect(result.errors).toEqual(mockErrors);
      expect(result.data).toBeNull();
    });

    it('should throw on client errors', async () => {
      (mockGraphQLClient.post as any).mockRejectedValue(new Error('Network error'));

      await expect(graphqlClient.query('query { test }')).rejects.toThrow('GraphQL query failed: Network error');
    });
  });

  describe('mutations', () => {
    it('should use the same endpoint for mutations', async () => {
      (mockGraphQLClient.post as any).mockResolvedValue({
        data: { createUser: { id: '123' } },
        errors: null
      });

      const mutation = 'mutation { createUser(input: {}) { id } }';
      await graphqlClient.mutate(mutation);

      expect(mockGraphQLClient.post).toHaveBeenCalledWith('/graphql', {
        query: mutation
      });
    });
  });
});