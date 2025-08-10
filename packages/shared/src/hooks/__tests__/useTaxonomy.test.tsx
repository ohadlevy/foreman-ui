import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, afterEach } from 'vitest';
import { useTaxonomyData, useUserOrganizations, useUserLocations } from '../useTaxonomy';
import { useTaxonomyStore } from '../../stores/taxonomyStore';
import { useAuth } from '../../auth/useAuth';
import { useApi } from '../useApi';
import { useUserContext } from '../useUserContext';
import { Organization, Location } from '../../types';

// Mock dependencies
vi.mock('../useApi');
vi.mock('../../auth/useAuth');
vi.mock('../useUserContext', () => ({
  useUserContext: vi.fn(),
}));

const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: 'org1',
    title: 'Organization 1',
    description: 'First organization',
  },
  {
    id: 2,
    name: 'org2',
    title: 'Organization 2',
    description: 'Second organization',
  },
];

const mockLocations: Location[] = [
  {
    id: 1,
    name: 'loc1',
    title: 'Location 1',
    description: 'First location',
  },
  {
    id: 2,
    name: 'loc2',
    title: 'Location 2',
    description: 'Second location',
  },
];

const mockUser = {
  id: 1,
  login: 'testuser',
  firstname: 'Test',
  lastname: 'User',
};

const mockApi = {
  organizations: {
    getUserOrganizations: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
  },
  locations: {
    getUserLocations: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
  },
};

const mockAuth = {
  hasPermission: vi.fn(),
  user: mockUser as typeof mockUser | null,
};

const mockUserContext = {
  data: {
    user: mockUser,
    organizations: mockOrganizations,
    locations: mockLocations,
  },
  isLoading: false,
  error: null,
};

describe('useTaxonomy hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset the auth mock to initial state
    mockAuth.user = mockUser;
    mockAuth.hasPermission.mockReturnValue(true);

    vi.mocked(useApi).mockReturnValue(mockApi as any);
    vi.mocked(useAuth).mockReturnValue(mockAuth as any);
    vi.mocked(useUserContext).mockReturnValue(mockUserContext as any);

    // Reset store
    const store = useTaxonomyStore.getState();
    store.resetContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUserOrganizations', () => {
    it('should fetch user organizations when user has permission', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockApi.organizations.getUserOrganizations.mockResolvedValue(mockOrganizations);

      const { result } = renderHook(() => useUserOrganizations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.organizations.getUserOrganizations).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockOrganizations);
    });

    it('should not fetch when user lacks permission', () => {
      mockAuth.hasPermission.mockReturnValue(false);

      const { result } = renderHook(() => useUserOrganizations(), { wrapper });

      // When query is disabled due to lack of permissions, it should be in idle state
      expect(result.current.status).toBe('loading');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApi.organizations.getUserOrganizations).not.toHaveBeenCalled();
    });

    it('should not fetch when no user is present', () => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockAuth.user = null;

      const { result } = renderHook(() => useUserOrganizations(), { wrapper });

      // When query is disabled due to no user, it should be in idle state
      expect(result.current.status).toBe('loading');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApi.organizations.getUserOrganizations).not.toHaveBeenCalled();
    });

    it('should update store with available organizations', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockApi.organizations.getUserOrganizations.mockResolvedValue(mockOrganizations);

      renderHook(() => useUserOrganizations(), { wrapper });

      await waitFor(() => {
        const store = useTaxonomyStore.getState();
        expect(store.availableOrganizations).toEqual(mockOrganizations);
      });
    });

    it('should auto-select organization when user has only one', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      const singleOrg = [mockOrganizations[0]];
      mockApi.organizations.getUserOrganizations.mockResolvedValue(singleOrg);

      renderHook(() => useUserOrganizations(), { wrapper });

      await waitFor(() => {
        const store = useTaxonomyStore.getState();
        expect(store.currentOrganization).toEqual(singleOrg[0]);
      });
    });

    it('should not auto-select when user has multiple organizations', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockApi.organizations.getUserOrganizations.mockResolvedValue(mockOrganizations);

      renderHook(() => useUserOrganizations(), { wrapper });

      await waitFor(() => {
        const store = useTaxonomyStore.getState();
        expect(store.availableOrganizations).toEqual(mockOrganizations);
        expect(store.currentOrganization).toBeNull();
      });
    });
  });

  describe('useUserLocations', () => {
    it('should fetch user locations when user has permission', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockApi.locations.getUserLocations.mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useUserLocations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.locations.getUserLocations).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockLocations);
    });

    it('should update store with available locations', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockApi.locations.getUserLocations.mockResolvedValue(mockLocations);

      renderHook(() => useUserLocations(), { wrapper });

      await waitFor(() => {
        const store = useTaxonomyStore.getState();
        expect(store.availableLocations).toEqual(mockLocations);
      });
    });

    it('should auto-select location when user has only one', async () => {
      mockAuth.hasPermission.mockReturnValue(true);
      const singleLoc = [mockLocations[0]];
      mockApi.locations.getUserLocations.mockResolvedValue(singleLoc);

      renderHook(() => useUserLocations(), { wrapper });

      await waitFor(() => {
        const store = useTaxonomyStore.getState();
        expect(store.currentLocation).toEqual(singleLoc[0]);
      });
    });
  });

  describe('useTaxonomyData', () => {
    beforeEach(() => {
      mockAuth.hasPermission.mockReturnValue(true);
      mockApi.organizations.getUserOrganizations.mockResolvedValue(mockOrganizations);
      mockApi.locations.getUserLocations.mockResolvedValue(mockLocations);
    });

    it('should provide current taxonomy context', async () => {
      const store = useTaxonomyStore.getState();
      store.setCurrentOrganization(mockOrganizations[0]);
      store.setCurrentLocation(mockLocations[0]);

      const { result } = renderHook(() => useTaxonomyData(), { wrapper });

      expect(result.current.currentOrganization).toEqual(mockOrganizations[0]);
      expect(result.current.currentLocation).toEqual(mockLocations[0]);
      expect(result.current.isContextSet).toBe(true);
    });

    it('should provide available organizations and locations', () => {
      const store = useTaxonomyStore.getState();
      store.setAvailableOrganizations(mockOrganizations);
      store.setAvailableLocations(mockLocations);

      const { result } = renderHook(() => useTaxonomyData(), { wrapper });

      expect(result.current.availableOrganizations).toEqual(mockOrganizations);
      expect(result.current.availableLocations).toEqual(mockLocations);
      expect(result.current.hasOrganizations).toBe(true);
      expect(result.current.hasLocations).toBe(true);
    });

    it('should provide context path', () => {
      const store = useTaxonomyStore.getState();
      store.setAvailableOrganizations(mockOrganizations);
      store.setAvailableLocations(mockLocations);
      store.setCurrentOrganization(mockOrganizations[0]);
      store.setCurrentLocation(mockLocations[0]);

      const { result } = renderHook(() => useTaxonomyData(), { wrapper });

      expect(result.current.getContextPath()).toBe('Organization 1 • Location 1');
    });

    it('should provide permission state', () => {
      mockAuth.hasPermission.mockImplementation((permission: string) => {
        if (permission === 'view_organizations') return true;
        if (permission === 'view_locations') return false;
        return false;
      });

      const { result } = renderHook(() => useTaxonomyData(), { wrapper });

      expect(result.current.canViewOrganizations).toBe(true);
      expect(result.current.canViewLocations).toBe(false);
    });

    it('should invalidate queries when context switches', () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useTaxonomyData(), { wrapper });

      result.current.switchContext(mockOrganizations[0], mockLocations[0]);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        predicate: expect.any(Function),
      });
    });

    it('should only invalidate taxonomy-scoped queries', () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useTaxonomyData(), { wrapper });

      result.current.switchContext(mockOrganizations[0], mockLocations[0]);

      const invalidateCall = invalidateQueriesSpy.mock.calls[0]?.[0] as { predicate?: (query: any) => boolean };
      expect(invalidateCall).toBeDefined();
      const predicate = invalidateCall?.predicate;
      expect(predicate).toBeDefined();

      // Test that hosts queries are invalidated
      expect(predicate!({ queryKey: ['hosts'] })).toBe(true);
      expect(predicate!({ queryKey: ['myHosts'] })).toBe(true);
      expect(predicate!({ queryKey: ['hostgroups'] })).toBe(true);

      // Test that non-scoped queries are not invalidated
      expect(predicate!({ queryKey: ['users'] })).toBe(false);
      expect(predicate!({ queryKey: ['organizations'] })).toBe(false);
      expect(predicate!({ queryKey: ['locations'] })).toBe(false);
    });
  });
});