import { useQuery, useQueryClient, Query, QueryKey } from '@tanstack/react-query';
import { useApi } from './useApi';
import { SearchParams, Organization, Location } from '../types';
import { useAuth } from '../auth/useAuth';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { useUserContext } from './useUserContext';
import { useEffect, useCallback } from 'react';

// Query keys that are scoped to taxonomy context and should be invalidated when context changes
const TAXONOMY_SCOPED_QUERY_KEYS = new Set(['hosts', 'myHosts', 'hostgroups']);

// Organizations hooks
export const useOrganizations = (params?: SearchParams) => {
  const { organizations } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['organizations', params],
    queryFn: () => organizations.list(params),
    keepPreviousData: true,
    enabled: hasPermission('view_organizations'),
  });
};

export const useUserOrganizations = () => {
  const { organizations } = useApi();
  const { hasPermission, user } = useAuth();
  const { setAvailableOrganizations, setCurrentOrganization, currentOrganization } = useTaxonomyStore();

  const query = useQuery({
    queryKey: ['userOrganizations', user?.id],
    queryFn: () => organizations.getUserOrganizations(),
    enabled: !!user && hasPermission('view_organizations'),
  });

  // Auto-update store when data changes
  useEffect(() => {
    if (query.data) {
      setAvailableOrganizations(query.data);

      // Set default organization if none selected and user has only one
      if (!currentOrganization && query.data.length === 1) {
        setCurrentOrganization(query.data[0]);
      }
    }
  }, [query.data, setAvailableOrganizations, setCurrentOrganization, currentOrganization]);

  return query;
};

export const useOrganization = (id: number, enabled = true) => {
  const { organizations } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizations.get(id),
    enabled: enabled && !!id && hasPermission('view_organizations'),
  });
};

// Locations hooks
export const useLocations = (params?: SearchParams) => {
  const { locations } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['locations', params],
    queryFn: () => locations.list(params),
    keepPreviousData: true,
    enabled: hasPermission('view_locations'),
  });
};

export const useUserLocations = () => {
  const { locations } = useApi();
  const { hasPermission, user } = useAuth();
  const { setAvailableLocations, setCurrentLocation, currentLocation } = useTaxonomyStore();

  const query = useQuery({
    queryKey: ['userLocations', user?.id],
    queryFn: () => locations.getUserLocations(),
    enabled: !!user && hasPermission('view_locations'),
  });

  // Auto-update store when data changes
  useEffect(() => {
    if (query.data) {
      setAvailableLocations(query.data);

      // Set default location if none selected and user has only one
      if (!currentLocation && query.data.length === 1) {
        setCurrentLocation(query.data[0]);
      }
    }
  }, [query.data, setAvailableLocations, setCurrentLocation, currentLocation]);

  return query;
};

export const useLocation = (id: number, enabled = true) => {
  const { locations } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => locations.get(id),
    enabled: enabled && !!id && hasPermission('view_locations'),
  });
};

// Combined taxonomy hooks
export const useTaxonomyData = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const {
    currentOrganization,
    currentLocation,
    availableOrganizations,
    availableLocations,
    setCurrentOrganization,
    setCurrentLocation,
    setAvailableOrganizations,
    setAvailableLocations,
    getContextPath,
    isContextSet,
  } = useTaxonomyStore();

  const userContextQuery = useUserContext();
  const { data: userContext, isLoading, error } = userContextQuery;

  // Update store when data changes
  useEffect(() => {
    if (userContext?.organizations) {
      setAvailableOrganizations(userContext.organizations);
    }
    if (userContext?.locations) {
      setAvailableLocations(userContext.locations);
    }
  }, [userContext, setAvailableOrganizations, setAvailableLocations]);

  // Memoize the query invalidation predicate to avoid unnecessary evaluations
  const taxonomyQueryPredicate = useCallback((query: Query<unknown, unknown, unknown, QueryKey>) => {
    const queryKey = query.queryKey;
    return queryKey.some((key: unknown) =>
      typeof key === 'string' && TAXONOMY_SCOPED_QUERY_KEYS.has(key)
    );
  }, []);

  // Helper function to switch context
  const switchContext = (organization: Organization | null, location: Location | null) => {
    setCurrentOrganization(organization);
    setCurrentLocation(location);

    // Invalidate queries that are scoped to taxonomy context
    // Only invalidate resources that actually change when org/location changes
    queryClient.invalidateQueries({
      predicate: taxonomyQueryPredicate
    });
  };

  return {
    // Current context
    currentOrganization,
    currentLocation,

    // Available options
    availableOrganizations,
    availableLocations,

    // Actions
    setCurrentOrganization,
    setCurrentLocation,
    switchContext,

    // Helpers
    getContextPath,
    isContextSet: isContextSet(),
    hasOrganizations: availableOrganizations.length > 0,
    hasLocations: availableLocations.length > 0,

    // Query state
    isLoading,
    error,

    // Permissions
    canViewOrganizations: hasPermission('view_organizations'),
    canViewLocations: hasPermission('view_locations'),
  };
};

// Helper hook for filtering resources by current taxonomy context
export const useTaxonomyFilter = () => {
  const { currentOrganization, currentLocation } = useTaxonomyStore();

  const getFilterParams = () => {
    const params: Record<string, number> = {};

    if (currentOrganization) {
      params.organization_id = currentOrganization.id;
    }

    if (currentLocation) {
      params.location_id = currentLocation.id;
    }

    return params;
  };

  return {
    filterParams: getFilterParams(),
    currentOrganization,
    currentLocation,
  };
};