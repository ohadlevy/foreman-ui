import { vi, beforeEach, describe, it, expect } from 'vitest';
import { TaxonomyAwareAPIClient, createTaxonomyAwareClient } from '../taxonomyClient';
import { ForemanAPIClient } from '../client';
import { Organization, Location } from '../../types';

// Mock the underlying client
const mockClient = {
  baseURL: 'http://localhost:3000/api/v2',
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  getPaginated: vi.fn(),
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  setLoggingOut: vi.fn(),
  handleError: vi.fn(),
  setupInterceptors: vi.fn(),
} as unknown as ForemanAPIClient;

const mockOrganization: Organization = {
  id: 1,
  name: 'test-org',
  title: 'Test Organization',
};

const mockLocation: Location = {
  id: 2,
  name: 'test-loc',
  title: 'Test Location',
};

describe('TaxonomyAwareAPIClient', () => {
  let taxonomyClient: TaxonomyAwareAPIClient;
  let getTaxonomyContext: ReturnType<typeof vi.fn<[], { currentOrganization: Organization | null; currentLocation: Location | null }>>;

  beforeEach(() => {
    vi.clearAllMocks();

    getTaxonomyContext = vi.fn().mockReturnValue({
      currentOrganization: null,
      currentLocation: null,
    });

    taxonomyClient = new TaxonomyAwareAPIClient(mockClient, getTaxonomyContext);
  });

  describe('Initialization', () => {
    it('should create instance with proper baseURL', () => {
      expect(taxonomyClient.baseURL).toBe('http://localhost:3000/api/v2');
    });

    it('should create instance with createTaxonomyAwareClient helper', () => {
      const client = createTaxonomyAwareClient(mockClient, getTaxonomyContext);
      expect(client).toBeInstanceOf(TaxonomyAwareAPIClient);
    });
  });

  describe('GET requests', () => {
    it('should add taxonomy params to GET requests when context is set', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: mockLocation,
      });

      await taxonomyClient.get('/hosts');

      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {
        params: {
          organization_id: 1,
          location_id: 2,
        },
      });
    });

    it('should add only organization_id when only organization is set', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: null,
      });

      await taxonomyClient.get('/hosts');

      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {
        params: {
          organization_id: 1,
        },
      });
    });

    it('should add only location_id when only location is set', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: null,
        currentLocation: mockLocation,
      });

      await taxonomyClient.get('/hosts');

      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {
        params: {
          location_id: 2,
        },
      });
    });

    it('should not add taxonomy params when no context is set', async () => {
      await taxonomyClient.get('/hosts');

      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {});
    });

    it('should merge with existing config params', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: null,
      });

      const config = {
        params: {
          search: 'test',
          per_page: 50,
        },
      };

      await taxonomyClient.get('/hosts', config);

      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {
        params: {
          search: 'test',
          per_page: 50,
          organization_id: 1,
        },
      });
    });
  });

  describe('POST requests', () => {
    it('should add taxonomy params to URL for POST requests', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: mockLocation,
      });

      const data = { name: 'test-host' };
      await taxonomyClient.post('/hosts', data);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/hosts?organization_id=1&location_id=2',
        data,
        undefined
      );
    });

    it('should handle URLs that already have query params', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: null,
      });

      const data = { name: 'test-host' };
      await taxonomyClient.post('/hosts?format=json', data);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/hosts?format=json&organization_id=1',
        data,
        undefined
      );
    });

    it('should not modify URL when no context is set', async () => {
      const data = { name: 'test-host' };
      await taxonomyClient.post('/hosts', data);

      expect(mockClient.post).toHaveBeenCalledWith('/hosts', data, undefined);
    });
  });

  describe('PUT requests', () => {
    it('should add taxonomy params to URL for PUT requests', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: mockLocation,
      });

      const data = { name: 'updated-host' };
      await taxonomyClient.put('/hosts/1', data);

      expect(mockClient.put).toHaveBeenCalledWith(
        '/hosts/1?organization_id=1&location_id=2',
        data,
        undefined
      );
    });
  });

  describe('DELETE requests', () => {
    it('should add taxonomy params to DELETE requests', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: mockLocation,
      });

      await taxonomyClient.delete('/hosts/1');

      expect(mockClient.delete).toHaveBeenCalledWith('/hosts/1', {
        params: {
          organization_id: 1,
          location_id: 2,
        },
      });
    });

    it('should merge with existing config params for DELETE', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: null,
      });

      const config = {
        params: {
          force: true,
        },
      };

      await taxonomyClient.delete('/hosts/1', config);

      expect(mockClient.delete).toHaveBeenCalledWith('/hosts/1', {
        params: {
          force: true,
          organization_id: 1,
        },
      });
    });
  });

  describe('getPaginated requests', () => {
    it('should add taxonomy params to paginated requests', async () => {
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: mockLocation,
      });

      const params = { page: 1, per_page: 20 };
      await taxonomyClient.getPaginated('/hosts', params);

      expect(mockClient.getPaginated).toHaveBeenCalledWith('/hosts', {
        page: 1,
        per_page: 20,
        organization_id: 1,
        location_id: 2,
      });
    });
  });

  describe('Pass-through methods', () => {
    it('should pass through token methods', () => {
      mockClient.getToken = vi.fn().mockReturnValue('test-token');

      expect(taxonomyClient.getToken()).toBe('test-token');

      taxonomyClient.setToken('new-token');
      expect(mockClient.setToken).toHaveBeenCalledWith('new-token');

      taxonomyClient.clearToken();
      expect(mockClient.clearToken).toHaveBeenCalled();
    });

    it('should pass through patch method', async () => {
      const data = { status: 'active' };
      await taxonomyClient.patch('/hosts/1', data);

      expect(mockClient.patch).toHaveBeenCalledWith('/hosts/1', data, undefined);
    });

    it('should provide access to unscoped client', () => {
      const unscopedClient = taxonomyClient.getUnscoped();
      expect(unscopedClient).toBe(mockClient);
    });

    it('should handle setLoggingOut method', () => {
      taxonomyClient.setLoggingOut(true);

      // Should call underlying client
      expect(mockClient.setLoggingOut).toHaveBeenCalledWith(true);
    });

    it('should handle handleError method', () => {
      const error = new Error('Test error');
      taxonomyClient.handleError(error);

      expect(mockClient.handleError).toHaveBeenCalledWith(error);
    });

    it('should handle error method properly', () => {
      const error = new Error('Test error');
      const mockErrorResult = { error: { message: 'Test error' } };

      mockClient.handleError = vi.fn().mockReturnValue(mockErrorResult);

      const result = taxonomyClient.handleError(error);

      expect(mockClient.handleError).toHaveBeenCalledWith(error);
      expect(result).toBe(mockErrorResult);
    });
  });

  describe('Dynamic context changes', () => {
    it('should use current context for each request', async () => {
      // First request with no context
      await taxonomyClient.get('/hosts');
      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {});

      // Change context
      getTaxonomyContext.mockReturnValue({
        currentOrganization: mockOrganization,
        currentLocation: null,
      });

      // Second request with organization context
      await taxonomyClient.get('/hosts');
      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {
        params: {
          organization_id: 1,
        },
      });

      // Change context again
      getTaxonomyContext.mockReturnValue({
        currentOrganization: null,
        currentLocation: mockLocation,
      });

      // Third request with location context
      await taxonomyClient.get('/hosts');
      expect(mockClient.get).toHaveBeenCalledWith('/hosts', {
        params: {
          location_id: 2,
        },
      });
    });
  });
});