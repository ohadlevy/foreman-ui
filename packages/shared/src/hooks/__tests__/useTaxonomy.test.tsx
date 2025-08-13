import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaxonomy, useOrganizationManagement, useLocationManagement } from '../useTaxonomy';
import type { EnhancedOrganization, EnhancedLocation } from '../../types/taxonomy';

// Mock dependencies
const mockTaxonomyApi = {
  organizations: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  locations: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
};

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
    users_count: 8
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
    users_count: 4
  }
];

const mockStore = {
  context: {
    organization: mockOrganizations[0],
    location: mockLocations[0]
  },
  permissions: {
    canViewOrganizations: true,
    canEditOrganizations: true,
    canCreateOrganizations: true,
    canDeleteOrganizations: true,
    canViewLocations: true,
    canEditLocations: true,
    canCreateLocations: true,
    canDeleteLocations: true,
    canSwitchContext: true
  },
  isLoading: false,
  error: null,
  isInitialized: true,
  availableOrganizations: mockOrganizations,
  availableLocations: mockLocations,
  setCurrentOrganization: vi.fn(),
  setCurrentLocation: vi.fn(),
  resetSelection: vi.fn()
};

// Create a simpler mock that works with vitest
vi.mock('../useApi', () => ({
  useApi: () => ({
    taxonomyApi: mockTaxonomyApi
  })
}));

vi.mock('../../stores/taxonomyStore', () => ({
  useTaxonomyStore: () => mockStore
}));

vi.mock('../useGlobalState', () => ({
  useGlobalTaxonomies: () => ({
    organizations: mockOrganizations,
    locations: mockLocations,
    isLoading: false,
    isError: false,
    error: null,
    isReady: true
  })
}));

vi.mock('../useTaxonomyQueries', () => ({
  useOrganizations: () => ({
    data: { results: mockOrganizations },
    isLoading: false,
    error: null,
    refetch: vi.fn()
  }),
  useLocations: () => ({
    data: { results: mockLocations },
    isLoading: false,
    error: null,
    refetch: vi.fn()
  }),
  useCreateOrganization: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }),
  useUpdateOrganization: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }),
  useDeleteOrganization: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }),
  useCreateLocation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }),
  useUpdateLocation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }),
  useDeleteLocation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  })
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useTaxonomy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTaxonomy', () => {
    it('should return current context and data', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTaxonomy(), { wrapper });

      expect(result.current.context).toEqual(mockStore.context);
      expect(result.current.permissions).toEqual(mockStore.permissions);
      expect(result.current.organizations).toEqual(mockOrganizations);
      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide store actions', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTaxonomy(), { wrapper });

      expect(result.current.actions.setCurrentOrganization).toBe(mockStore.setCurrentOrganization);
      expect(result.current.actions.setCurrentLocation).toBe(mockStore.setCurrentLocation);
      expect(result.current.actions.resetSelection).toBe(mockStore.resetSelection);
    });

    it('should provide mutation functions', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTaxonomy(), { wrapper });

      expect(result.current.mutations.createOrganization).toBeDefined();
      expect(result.current.mutations.updateOrganization).toBeDefined();
      expect(result.current.mutations.deleteOrganization).toBeDefined();
      expect(result.current.mutations.createLocation).toBeDefined();
      expect(result.current.mutations.updateLocation).toBeDefined();
      expect(result.current.mutations.deleteLocation).toBeDefined();
    });

  });

  describe('useOrganizationManagement', () => {
    it('should return organization-specific functionality', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrganizationManagement(), { wrapper });

      expect(result.current.currentOrganization).toEqual(mockOrganizations[0]);
      expect(result.current.organizations).toEqual(mockOrganizations);
      expect(result.current.permissions.canView).toBe(true);
      expect(result.current.permissions.canEdit).toBe(true);
      expect(result.current.permissions.canCreate).toBe(true);
      expect(result.current.permissions.canDelete).toBe(true);
      expect(result.current.actions.setCurrent).toBe(mockStore.setCurrentOrganization);
    });

    it('should provide organization-specific actions', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrganizationManagement(), { wrapper });

      expect(typeof result.current.actions.create).toBe('function');
      expect(typeof result.current.actions.update).toBe('function');
      expect(typeof result.current.actions.delete).toBe('function');
    });

    it('should provide mutation objects', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOrganizationManagement(), { wrapper });

      expect(result.current.mutations.create).toBeDefined();
      expect(result.current.mutations.update).toBeDefined();
      expect(result.current.mutations.delete).toBeDefined();
    });
  });

  describe('useLocationManagement', () => {
    it('should return location-specific functionality', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useLocationManagement(), { wrapper });

      expect(result.current.currentLocation).toEqual(mockLocations[0]);
      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.permissions.canView).toBe(true);
      expect(result.current.permissions.canEdit).toBe(true);
      expect(result.current.permissions.canCreate).toBe(true);
      expect(result.current.permissions.canDelete).toBe(true);
      expect(result.current.actions.setCurrent).toBe(mockStore.setCurrentLocation);
    });

    it('should provide location-specific actions', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useLocationManagement(), { wrapper });

      expect(typeof result.current.actions.create).toBe('function');
      expect(typeof result.current.actions.update).toBe('function');
      expect(typeof result.current.actions.delete).toBe('function');
    });

    it('should provide mutation objects', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useLocationManagement(), { wrapper });

      expect(result.current.mutations.create).toBeDefined();
      expect(result.current.mutations.update).toBeDefined();
      expect(result.current.mutations.delete).toBeDefined();
    });
  });
});