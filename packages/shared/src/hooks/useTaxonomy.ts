import { useMemo } from 'react';
import { useApi } from './useApi';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { 
  useOrganizations, 
  useLocations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation
} from './useTaxonomyQueries';
import type { TaxonomyQueryParams } from '../types/taxonomy';

/**
 * Helper function for safe error message extraction
 */
const getErrorMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return error ? String(error) : null;
};

/**
 * Extract data with clear precedence order: API results > Context store > Empty array
 */
const getDataWithFallback = <T>(
  apiData: T[] | undefined,
  contextData: T[] | undefined
): T[] => {
  return apiData ?? contextData ?? [];
};

/**
 * Configuration options for the useTaxonomy hook
 */
interface UseTaxonomyOptions {
  /** Whether to automatically fetch data */
  enabled?: boolean;
  /** Query parameters for organizations */
  organizationParams?: TaxonomyQueryParams;
  /** Query parameters for locations */
  locationParams?: TaxonomyQueryParams;
  /** Whether to fetch organizations */
  fetchOrganizations?: boolean;
  /** Whether to fetch locations */
  fetchLocations?: boolean;
}

/**
 * Main taxonomy hook that combines store state with React Query data fetching
 * 
 * This hook provides a complete interface for taxonomy management including:
 * - Current context from store
 * - Data fetching with React Query
 * - Mutation functions for CRUD operations
 * - Loading and error states
 */
export const useTaxonomy = (options: UseTaxonomyOptions = {}) => {
  const {
    enabled = true,
    organizationParams = {},
    locationParams = {},
    fetchOrganizations = true,
    fetchLocations = true
  } = options;

  // Get API instance
  const { taxonomyApi } = useApi();

  // Get store state
  const {
    context,
    permissions,
    isLoading: storeLoading,
    error: storeError,
    isInitialized,
    setCurrentOrganization,
    setCurrentLocation,
    resetSelection
  } = useTaxonomyStore();

  // Fetch organizations
  const organizationsQuery = useOrganizations(
    taxonomyApi,
    organizationParams,
    { enabled: enabled && fetchOrganizations }
  );

  // Fetch locations
  const locationsQuery = useLocations(
    taxonomyApi,
    locationParams,
    { enabled: enabled && fetchLocations }
  );

  // Mutation hooks
  const createOrganization = useCreateOrganization(taxonomyApi);
  const updateOrganization = useUpdateOrganization(taxonomyApi);
  const deleteOrganization = useDeleteOrganization(taxonomyApi);
  const createLocation = useCreateLocation(taxonomyApi);
  const updateLocation = useUpdateLocation(taxonomyApi);
  const deleteLocation = useDeleteLocation(taxonomyApi);

  // Combine loading states
  const isLoading = storeLoading || 
    (fetchOrganizations && organizationsQuery.isLoading) ||
    (fetchLocations && locationsQuery.isLoading);

  // Combine error states
  const error = storeError || 
    getErrorMessage(organizationsQuery.error) || 
    getErrorMessage(locationsQuery.error) || 
    null;

  // Memoized result
  return useMemo(() => ({
    // Current context
    context,
    permissions,
    isInitialized,

    // Data from queries with clear precedence order
    organizations: getDataWithFallback(organizationsQuery.data?.results, context.availableOrganizations),
    locations: getDataWithFallback(locationsQuery.data?.results, context.availableLocations),

    // Loading and error states
    isLoading,
    error,

    // Individual query states
    queries: {
      organizations: organizationsQuery,
      locations: locationsQuery
    },

    // Store actions
    actions: {
      setCurrentOrganization,
      setCurrentLocation,
      resetSelection
    },

    // Mutations
    mutations: {
      createOrganization,
      updateOrganization,
      deleteOrganization,
      createLocation,
      updateLocation,
      deleteLocation
    },

    // Utility functions
    refetch: () => {
      if (fetchOrganizations) organizationsQuery.refetch();
      if (fetchLocations) locationsQuery.refetch();
    }
  }), [
    context,
    permissions,
    isInitialized,
    organizationsQuery,
    locationsQuery,
    isLoading,
    error,
    setCurrentOrganization,
    setCurrentLocation,
    resetSelection,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    createLocation,
    updateLocation,
    deleteLocation,
    fetchOrganizations,
    fetchLocations
  ]);
};

/**
 * Hook that provides only organization-related functionality
 */
export const useOrganizationManagement = (params: TaxonomyQueryParams = {}) => {
  const { taxonomyApi } = useApi();
  const { 
    context, 
    permissions, 
    setCurrentOrganization 
  } = useTaxonomyStore();

  const query = useOrganizations(taxonomyApi, params);
  const createMutation = useCreateOrganization(taxonomyApi);
  const updateMutation = useUpdateOrganization(taxonomyApi);
  const deleteMutation = useDeleteOrganization(taxonomyApi);

  return useMemo(() => ({
    currentOrganization: context.organization,
    organizations: query.data?.results || [],
    isLoading: query.isLoading,
    error: getErrorMessage(query.error),
    permissions: {
      canView: permissions.canViewOrganizations,
      canEdit: permissions.canEditOrganizations,
      canCreate: permissions.canCreateOrganizations,
      canDelete: permissions.canDeleteOrganizations
    },
    actions: {
      setCurrent: setCurrentOrganization,
      create: createMutation.mutate,
      update: updateMutation.mutate,
      delete: deleteMutation.mutate,
      refetch: query.refetch
    },
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation
    }
  }), [
    context.organization,
    query,
    permissions,
    setCurrentOrganization,
    createMutation,
    updateMutation,
    deleteMutation
  ]);
};

/**
 * Hook that provides only location-related functionality
 */
export const useLocationManagement = (params: TaxonomyQueryParams = {}) => {
  const { taxonomyApi } = useApi();
  const { 
    context, 
    permissions, 
    setCurrentLocation 
  } = useTaxonomyStore();

  const query = useLocations(taxonomyApi, params);
  const createMutation = useCreateLocation(taxonomyApi);
  const updateMutation = useUpdateLocation(taxonomyApi);
  const deleteMutation = useDeleteLocation(taxonomyApi);

  return useMemo(() => ({
    currentLocation: context.location,
    locations: query.data?.results || [],
    isLoading: query.isLoading,
    error: getErrorMessage(query.error),
    permissions: {
      canView: permissions.canViewLocations,
      canEdit: permissions.canEditLocations,
      canCreate: permissions.canCreateLocations,
      canDelete: permissions.canDeleteLocations
    },
    actions: {
      setCurrent: setCurrentLocation,
      create: createMutation.mutate,
      update: updateMutation.mutate,
      delete: deleteMutation.mutate,
      refetch: query.refetch
    },
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation
    }
  }), [
    context.location,
    query,
    permissions,
    setCurrentLocation,
    createMutation,
    updateMutation,
    deleteMutation
  ]);
};