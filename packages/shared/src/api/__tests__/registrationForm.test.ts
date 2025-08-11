import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrationFormAPI } from '../registrationForm';
import { HostGroup, SmartProxy } from '../../types';
import { createForemanClient } from '../client';

// Mock the ForemanAPIClient
vi.mock('../client', () => ({
  createForemanClient: vi.fn(),
}));

describe('RegistrationFormAPI', () => {
  let api: RegistrationFormAPI;
  let mockClient: {
    getPaginated: ReturnType<typeof vi.fn>;
    getToken: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    baseURL: string;
  };
  let mockGraphQLClient: {
    post: ReturnType<typeof vi.fn>;
    baseURL: string;
  };

  beforeEach(() => {
    mockClient = {
      getPaginated: vi.fn(),
      getToken: vi.fn().mockReturnValue('test-token'),
      post: vi.fn(),
      baseURL: 'https://foreman.example.com/api/v2',
    };

    // Mock createForemanClient to return a mock client for GraphQL
    mockGraphQLClient = {
      post: vi.fn().mockRejectedValue(new Error('GraphQL failed')),
      baseURL: '/api',
    };
    vi.mocked(createForemanClient).mockReturnValue(mockGraphQLClient as any);

    api = new RegistrationFormAPI(mockClient as any);
  });

  describe('getFormData', () => {
    it('should use REST API fallback when GraphQL fails', async () => {
      const mockHostGroups: HostGroup[] = [
        { id: 1, name: 'Test Group', title: 'Test Group Title' },
      ];
      const mockSmartProxies: SmartProxy[] = [
        { id: 1, name: 'Test Proxy', url: 'https://proxy.example.com' },
      ];

      // Mock GraphQL failure
      mockClient.post.mockRejectedValue(new Error('GraphQL failed'));

      // Mock REST API success
      mockClient.getPaginated
        .mockResolvedValueOnce({ results: mockHostGroups })
        .mockResolvedValueOnce({ results: mockSmartProxies });

      const result = await api.getFormData();

      expect(result).toEqual({
        hostGroups: mockHostGroups,
        smartProxies: mockSmartProxies,
      });

      expect(mockClient.getPaginated).toHaveBeenCalledTimes(2);
      expect(mockClient.getPaginated).toHaveBeenCalledWith('/hostgroups');
      expect(mockClient.getPaginated).toHaveBeenCalledWith('/smart_proxies');
    });

    it('should return empty data when both GraphQL and REST fail', async () => {
      // Mock GraphQL failure
      mockClient.post.mockRejectedValue(new Error('GraphQL failed'));

      // Mock REST API failure
      mockClient.getPaginated.mockRejectedValue(new Error('REST failed'));

      const result = await api.getFormData();

      expect(result).toEqual({
        hostGroups: [],
        smartProxies: [],
      });
    });

    it('should use GraphQL when available', async () => {
      const mockHostGroups: HostGroup[] = [
        { id: 1, name: 'Test Group', title: 'Test Group Title' },
      ];
      const mockSmartProxies: SmartProxy[] = [
        { id: 1, name: 'Test Proxy', url: 'https://proxy.example.com' },
      ];

      const mockGraphQLResponse = {
        data: {
          hostgroups: { 
            edges: mockHostGroups.map(group => ({ node: group }))
          },
          smartProxies: { 
            edges: mockSmartProxies.map(proxy => ({ node: proxy }))
          },
        },
      };

      // Mock GraphQL success via GraphQL client.post
      mockGraphQLClient.post.mockResolvedValue(mockGraphQLResponse);

      const result = await api.getFormData();

      expect(result).toEqual({
        hostGroups: mockHostGroups,
        smartProxies: mockSmartProxies,
      });

      expect(mockGraphQLClient.post).toHaveBeenCalledWith('/graphql', {
        query: expect.stringContaining('query RegistrationFormData'),
      });
    });
  });
});