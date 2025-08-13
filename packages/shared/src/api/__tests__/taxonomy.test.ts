import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationsAPI, LocationsAPI, TaxonomyAPI } from '../taxonomy';
import type { ForemanAPIClient } from '../client';

// Mock GraphQL client to prevent network issues in tests
vi.mock('../graphqlClient', () => ({
  createGraphQLClient: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({ data: null, errors: ['GraphQL mocked in tests'] })
  }))
}));
import type {
  EnhancedOrganization,
  EnhancedLocation,
  TaxonomyApiResponse,
  OrganizationCreateData,
  LocationCreateData
} from '../../types/taxonomy';

// Mock API client with proper vitest mocks
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getPaginated: vi.fn(),
  getToken: vi.fn().mockReturnValue('mock-token')
} as unknown as ForemanAPIClient;

// Mock data
const mockOrganizations: EnhancedOrganization[] = [
  {
    id: 1,
    name: 'org1',
    title: 'Organization 1',
    description: 'First organization',
    hosts_count: 10,
    users_count: 5
  },
  {
    id: 2,
    name: 'org2',
    title: 'Organization 2',
    description: 'Second organization',
    hosts_count: 15,
    users_count: 8,
    parent_id: 1
  }
];

const mockLocations: EnhancedLocation[] = [
  {
    id: 1,
    name: 'loc1',
    title: 'Location 1',
    description: 'First location',
    hosts_count: 12,
    users_count: 6
  },
  {
    id: 2,
    name: 'loc2',
    title: 'Location 2',
    description: 'Second location',
    hosts_count: 8,
    users_count: 4,
    parent_id: 1
  }
];

const mockApiResponse: TaxonomyApiResponse<EnhancedOrganization[]> = {
  results: mockOrganizations,
  total: 2,
  subtotal: 2,
  page: 1,
  per_page: 100,
  can_create: true
};

describe('OrganizationsAPI', () => {
  let organizationsApi: OrganizationsAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    organizationsApi = new OrganizationsAPI(mockApiClient);
  });

  describe('list', () => {
    it('should fetch all organizations with default parameters', async () => {
      vi.mocked(mockApiClient.getPaginated).mockResolvedValue(mockApiResponse);

      const result = await organizationsApi.list();

      expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
        '/organizations',
        {
          per_page: 100,
          include_hosts_count: true,
          include_users_count: true
        }
      );
      expect(result).toEqual(mockApiResponse);
    });

    it('should fetch organizations with custom parameters', async () => {
      vi.mocked(mockApiClient.getPaginated).mockResolvedValue(mockApiResponse);

      await organizationsApi.list({ page: 2, per_page: 50, search: 'test' });

      expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
        '/organizations',
        {
          per_page: 50,
          include_hosts_count: true,
          include_users_count: true,
          page: 2,
          search: 'test'
        }
      );
    });
  });

  describe('get', () => {
    it('should fetch a specific organization', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockOrganizations[0]);

      const result = await organizationsApi.get(1);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/organizations/1',
        { params: { include_hosts_count: true, include_users_count: true } }
      );
      expect(result).toEqual(mockOrganizations[0]);
    });
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const createData: OrganizationCreateData = {
        name: 'new-org',
        title: 'New Organization',
        description: 'A new organization'
      };
      const newOrg = { id: 3, ...createData, hosts_count: 0, users_count: 0 };

      vi.mocked(mockApiClient.post).mockResolvedValue(newOrg);

      const result = await organizationsApi.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/organizations',
        { organization: createData }
      );
      expect(result).toEqual(newOrg);
    });
  });

  describe('update', () => {
    it('should update an existing organization', async () => {
      const updateData = { title: 'Updated Organization' };
      const updatedOrg = { ...mockOrganizations[0], ...updateData };

      vi.mocked(mockApiClient.put).mockResolvedValue(updatedOrg);

      const result = await organizationsApi.update(1, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/organizations/1',
        { organization: updateData }
      );
      expect(result).toEqual(updatedOrg);
    });
  });

  describe('delete', () => {
    it('should delete an organization', async () => {
      vi.mocked(mockApiClient.delete).mockResolvedValue(undefined);

      await organizationsApi.delete(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/organizations/1'
      );
    });
  });

  describe('search', () => {
    it('should search organizations', async () => {
      vi.mocked(mockApiClient.getPaginated).mockResolvedValue(mockApiResponse);

      await organizationsApi.search('test query', { page: 1 });

      expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
        '/organizations',
        {
          per_page: 100,
          include_hosts_count: true,
          include_users_count: true,
          page: 1,
          search: 'test query'
        }
      );
    });
  });

  describe('getHostsCount', () => {
    it('should fetch hosts count for organization', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ total: 25 });

      const result = await organizationsApi.getHostsCount(1);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/organizations/1/hosts',
        { params: { per_page: 1 } }
      );
      expect(result).toBe(25);
    });
  });

  describe('getUsersCount', () => {
    it('should fetch users count for organization', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ total: 15 });

      const result = await organizationsApi.getUsersCount(1);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/organizations/1/users',
        { params: { per_page: 1 } }
      );
      expect(result).toBe(15);
    });
  });
});

describe('LocationsAPI', () => {
  let locationsApi: LocationsAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    locationsApi = new LocationsAPI(mockApiClient);
  });

  describe('list', () => {
    it('should fetch all locations with default parameters', async () => {
      const mockLocationResponse: TaxonomyApiResponse<EnhancedLocation[]> = {
        results: mockLocations,
        total: 2,
        subtotal: 2,
        page: 1,
        per_page: 100,
        can_create: true
      };

      vi.mocked(mockApiClient.getPaginated).mockResolvedValue(mockLocationResponse);

      const result = await locationsApi.list();

      expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
        '/locations',
        {
          per_page: 100,
          include_hosts_count: true,
          include_users_count: true
        }
      );
      expect(result).toEqual(mockLocationResponse);
    });
  });

  describe('get', () => {
    it('should fetch a specific location', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockLocations[0]);

      const result = await locationsApi.get(1);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/locations/1',
        { params: { include_hosts_count: true, include_users_count: true } }
      );
      expect(result).toEqual(mockLocations[0]);
    });
  });

  describe('create', () => {
    it('should create a new location', async () => {
      const createData: LocationCreateData = {
        name: 'new-loc',
        title: 'New Location',
        description: 'A new location'
      };
      const newLoc = { id: 3, ...createData, hosts_count: 0, users_count: 0 };

      vi.mocked(mockApiClient.post).mockResolvedValue(newLoc);

      const result = await locationsApi.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/locations',
        { location: createData }
      );
      expect(result).toEqual(newLoc);
    });
  });
});

describe('TaxonomyAPI', () => {
  let taxonomyApi: TaxonomyAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    taxonomyApi = new TaxonomyAPI(mockApiClient);
  });

  describe('getAll', () => {
    it('should fetch both organizations and locations in parallel', async () => {
      const orgResponse: TaxonomyApiResponse<EnhancedOrganization[]> = {
        results: mockOrganizations,
        total: 2,
        subtotal: 2,
        page: 1,
        per_page: 100,
        can_create: true
      };

      const locResponse: TaxonomyApiResponse<EnhancedLocation[]> = {
        results: mockLocations,
        total: 2,
        subtotal: 2,
        page: 1,
        per_page: 100,
        can_create: true
      };

      vi.mocked(mockApiClient.getPaginated)
        .mockResolvedValueOnce(orgResponse)
        .mockResolvedValueOnce(locResponse);

      const result = await taxonomyApi.getAll();

      expect(mockApiClient.getPaginated).toHaveBeenCalledTimes(2);
      expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
        '/organizations',
        expect.any(Object)
      );
      expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
        '/locations',
        expect.any(Object)
      );
      expect(result).toEqual({
        organizations: orgResponse,
        locations: locResponse
      });
    });
  });

  describe('searchAll', () => {
    it('should search both organizations and locations in parallel', async () => {
      const orgResponse: TaxonomyApiResponse<EnhancedOrganization[]> = {
        results: [],
        total: 0,
        subtotal: 0,
        page: 1,
        per_page: 100,
        can_create: true
      };

      const locResponse: TaxonomyApiResponse<EnhancedLocation[]> = {
        results: [],
        total: 0,
        subtotal: 0,
        page: 1,
        per_page: 100,
        can_create: true
      };

      vi.mocked(mockApiClient.getPaginated)
        .mockResolvedValueOnce(orgResponse)
        .mockResolvedValueOnce(locResponse);

      const result = await taxonomyApi.searchAll('test query');

      expect(mockApiClient.getPaginated).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        organizations: orgResponse,
        locations: locResponse
      });
    });
  });
});