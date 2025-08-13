import { useMemo } from 'react';
import { useApi } from './useApi';
import { useGlobalState } from './useGlobalState';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { 
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation
} from './useTaxonomyQueries';
import type { TaxonomyQueryParams, EnhancedOrganization, EnhancedLocation } from '../types/taxonomy';

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
  if (error) {
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
  return null;
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
 * Main taxonomy hook that combines store state with global state data fetching
 * 
 * This hook provides a complete interface for taxonomy management including:
 * - Current context from store
 * - Data fetching from global state (optimized with single GraphQL query)
 * - Mutation functions for CRUD operations
 * - Loading and error states
 */
export const useTaxonomy = (options: UseTaxonomyOptions = {}) => {
  const {
    enabled = true,
    fetchOrganizations = true,
    fetchLocations = true
  } = options;

  // Get API instance for mutations
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

  // Get data from global state (consolidates user + taxonomies in one query)
  const {
    organizations: globalOrganizations,
    locations: globalLocations,
    isLoading: globalLoading,
    isError: globalError,
    error: globalErrorMessage
  } = useGlobalState();

  // Mutation hooks
  const createOrganization = useCreateOrganization(taxonomyApi);
  const updateOrganization = useUpdateOrganization(taxonomyApi);
  const deleteOrganization = useDeleteOrganization(taxonomyApi);
  const createLocation = useCreateLocation(taxonomyApi);
  const updateLocation = useUpdateLocation(taxonomyApi);
  const deleteLocation = useDeleteLocation(taxonomyApi);

  // Combine loading states
  const isLoading = storeLoading || (enabled && globalLoading);

  // Combine error states
  const error = storeError || 
    (globalError ? getErrorMessage(globalErrorMessage) : null);

  // Memoized result
  return useMemo(() => ({
    // Current context
    context,
    permissions,
    isInitialized,

    // Data from global state with fallback to context store
    organizations: fetchOrganizations ? 
      getDataWithFallback(globalOrganizations, context.availableOrganizations) : 
      (context.availableOrganizations || []),
    locations: fetchLocations ? 
      getDataWithFallback(globalLocations, context.availableLocations) : 
      (context.availableLocations || []),

    // Loading and error states
    isLoading,
    error,

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
    }
  }), [
    context,
    permissions,
    isInitialized,
    globalOrganizations,
    globalLocations,
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
 * Takes global data as parameters to avoid redundant queries
 */
export const useOrganizationManagement = (
  _params: TaxonomyQueryParams = {},
  globalData?: { organizations?: EnhancedOrganization[]; isLoading?: boolean; error?: string | null }
) => {
  const { taxonomyApi } = useApi();
  const { 
    context, 
    permissions, 
    setCurrentOrganization 
  } = useTaxonomyStore();

  // Use provided global data or fetch independently if not provided
  const fallbackData = useGlobalState();
  const { organizations, isLoading, error } = globalData || {
    organizations: fallbackData.organizations,
    isLoading: fallbackData.isLoading,
    error: fallbackData.isError ? getErrorMessage(fallbackData.error) : null
  };
  
  const createMutation = useCreateOrganization(taxonomyApi);
  const updateMutation = useUpdateOrganization(taxonomyApi);
  const deleteMutation = useDeleteOrganization(taxonomyApi);

  return useMemo(() => ({
    currentOrganization: context.organization,
    organizations: organizations || [],
    isLoading,
    error,
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
      delete: deleteMutation.mutate
    },
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation
    }
  }), [
    context.organization,
    organizations,
    isLoading,
    error,
    permissions,
    setCurrentOrganization,
    createMutation,
    updateMutation,
    deleteMutation
  ]);
};

/**
 * Hook that provides only location-related functionality
 * Takes global data as parameters to avoid redundant queries
 */
export const useLocationManagement = (
  _params: TaxonomyQueryParams = {},
  globalData?: { locations?: EnhancedLocation[]; isLoading?: boolean; error?: string | null }
) => {
  const { taxonomyApi } = useApi();
  const { 
    context, 
    permissions, 
    setCurrentLocation 
  } = useTaxonomyStore();

  // Use provided global data or fetch independently if not provided
  const fallbackData = useGlobalState();
  const { locations, isLoading, error } = globalData || {
    locations: fallbackData.locations,
    isLoading: fallbackData.isLoading,
    error: fallbackData.isError ? getErrorMessage(fallbackData.error) : null
  };
  
  const createMutation = useCreateLocation(taxonomyApi);
  const updateMutation = useUpdateLocation(taxonomyApi);
  const deleteMutation = useDeleteLocation(taxonomyApi);

  return useMemo(() => ({
    currentLocation: context.location,
    locations: locations || [],
    isLoading,
    error,
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
      delete: deleteMutation.mutate
    },
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation
    }
  }), [
    context.location,
    locations,
    isLoading,
    error,
    permissions,
    setCurrentLocation,
    createMutation,
    updateMutation,
    deleteMutation
  ]);
};