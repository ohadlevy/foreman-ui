import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  EnhancedOrganization,
  EnhancedLocation,
  TaxonomyApiResponse,
  OrganizationCreateData,
  LocationCreateData,
  OrganizationUpdateData,
  LocationUpdateData,
  TaxonomyQueryParams
} from '../types/taxonomy';
import { TaxonomyAPI } from '../api/taxonomy';

/**
 * Query keys for taxonomy-related queries
 */
export const TAXONOMY_QUERY_KEYS = {
  all: ['taxonomy'] as const,
  organizations: () => [...TAXONOMY_QUERY_KEYS.all, 'organizations'] as const,
  organizationsList: (params?: TaxonomyQueryParams) => 
    [...TAXONOMY_QUERY_KEYS.organizations(), 'list', params] as const,
  organizationsDetail: (id: number) => 
    [...TAXONOMY_QUERY_KEYS.organizations(), 'detail', id] as const,
  organizationsSearch: (query: string, params?: TaxonomyQueryParams) => 
    [...TAXONOMY_QUERY_KEYS.organizations(), 'search', query, params] as const,
  
  locations: () => [...TAXONOMY_QUERY_KEYS.all, 'locations'] as const,
  locationsList: (params?: TaxonomyQueryParams) => 
    [...TAXONOMY_QUERY_KEYS.locations(), 'list', params] as const,
  locationsDetail: (id: number) => 
    [...TAXONOMY_QUERY_KEYS.locations(), 'detail', id] as const,
  locationsSearch: (query: string, params?: TaxonomyQueryParams) => 
    [...TAXONOMY_QUERY_KEYS.locations(), 'search', query, params] as const,
    
  combined: () => [...TAXONOMY_QUERY_KEYS.all, 'combined'] as const,
  combinedList: (params?: TaxonomyQueryParams) => 
    [...TAXONOMY_QUERY_KEYS.combined(), 'list', params] as const,
  combinedSearch: (query: string, params?: TaxonomyQueryParams) => 
    [...TAXONOMY_QUERY_KEYS.combined(), 'search', query, params] as const
} as const;

/**
 * Hook configuration options
 */
interface UseTaxonomyQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number; // Renamed from cacheTime in newer TanStack Query versions
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook to fetch all organizations
 */
export const useOrganizations = (
  taxonomyApi: TaxonomyAPI,
  params: TaxonomyQueryParams = {},
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.organizationsList(params),
    queryFn: () => taxonomyApi.organizations.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces deprecated cacheTime)
    ...options
  });
};

/**
 * Hook to fetch a specific organization by ID
 */
export const useOrganization = (
  taxonomyApi: TaxonomyAPI,
  id: number,
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.organizationsDetail(id),
    queryFn: () => taxonomyApi.organizations.get(id),
    enabled: !!id && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to search organizations
 */
export const useOrganizationsSearch = (
  taxonomyApi: TaxonomyAPI,
  query: string,
  params: TaxonomyQueryParams = {},
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.organizationsSearch(query, params),
    queryFn: () => taxonomyApi.organizations.search(query, params),
    enabled: !!query.trim() && options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to fetch all locations
 */
export const useLocations = (
  taxonomyApi: TaxonomyAPI,
  params: TaxonomyQueryParams = {},
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.locationsList(params),
    queryFn: () => taxonomyApi.locations.list(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to fetch a specific location by ID
 */
export const useLocation = (
  taxonomyApi: TaxonomyAPI,
  id: number,
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.locationsDetail(id),
    queryFn: () => taxonomyApi.locations.get(id),
    enabled: !!id && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to search locations
 */
export const useLocationsSearch = (
  taxonomyApi: TaxonomyAPI,
  query: string,
  params: TaxonomyQueryParams = {},
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.locationsSearch(query, params),
    queryFn: () => taxonomyApi.locations.search(query, params),
    enabled: !!query.trim() && options.enabled !== false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to fetch both organizations and locations in parallel
 */
export const useTaxonomy = (
  taxonomyApi: TaxonomyAPI,
  params: TaxonomyQueryParams = {},
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.combinedList(params),
    queryFn: () => taxonomyApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to search both organizations and locations
 */
export const useTaxonomySearch = (
  taxonomyApi: TaxonomyAPI,
  query: string,
  params: TaxonomyQueryParams = {},
  options: UseTaxonomyQueryOptions = {}
) => {
  return useQuery({
    queryKey: TAXONOMY_QUERY_KEYS.combinedSearch(query, params),
    queryFn: () => taxonomyApi.searchAll(query, params),
    enabled: !!query.trim() && options.enabled !== false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Hook to create a new organization
 */
export const useCreateOrganization = (taxonomyApi: TaxonomyAPI) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrganizationCreateData) => taxonomyApi.organizations.create(data),
    onSuccess: (newOrganization) => {
      // Invalidate organizations queries to refetch
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.organizations() });
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.combined() });
      
      // Add to existing cache if present
      const existingData = queryClient.getQueryData<TaxonomyApiResponse<EnhancedOrganization[]>>(
        TAXONOMY_QUERY_KEYS.organizationsList()
      );
      if (existingData) {
        queryClient.setQueryData(
          TAXONOMY_QUERY_KEYS.organizationsList(),
          {
            ...existingData,
            results: [newOrganization, ...existingData.results],
            total: existingData.total + 1
          }
        );
      }
    }
  });
};

/**
 * Hook to update an organization
 */
export const useUpdateOrganization = (taxonomyApi: TaxonomyAPI) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrganizationUpdateData }) => 
      taxonomyApi.organizations.update(id, data),
    onSuccess: (updatedOrganization) => {
      // Update specific organization cache
      queryClient.setQueryData(
        TAXONOMY_QUERY_KEYS.organizationsDetail(updatedOrganization.id),
        updatedOrganization
      );
      
      // Invalidate list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.organizations() });
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.combined() });
    }
  });
};

/**
 * Hook to delete an organization
 */
export const useDeleteOrganization = (taxonomyApi: TaxonomyAPI) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => taxonomyApi.organizations.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ 
        queryKey: TAXONOMY_QUERY_KEYS.organizationsDetail(deletedId) 
      });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.organizations() });
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.combined() });
    }
  });
};

/**
 * Hook to create a new location
 */
export const useCreateLocation = (taxonomyApi: TaxonomyAPI) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LocationCreateData) => taxonomyApi.locations.create(data),
    onSuccess: (newLocation) => {
      // Invalidate locations queries to refetch
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.locations() });
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.combined() });
      
      // Add to existing cache if present
      const existingData = queryClient.getQueryData<TaxonomyApiResponse<EnhancedLocation[]>>(
        TAXONOMY_QUERY_KEYS.locationsList()
      );
      if (existingData) {
        queryClient.setQueryData(
          TAXONOMY_QUERY_KEYS.locationsList(),
          {
            ...existingData,
            results: [newLocation, ...existingData.results],
            total: existingData.total + 1
          }
        );
      }
    }
  });
};

/**
 * Hook to update a location
 */
export const useUpdateLocation = (taxonomyApi: TaxonomyAPI) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationUpdateData }) => 
      taxonomyApi.locations.update(id, data),
    onSuccess: (updatedLocation) => {
      // Update specific location cache
      queryClient.setQueryData(
        TAXONOMY_QUERY_KEYS.locationsDetail(updatedLocation.id),
        updatedLocation
      );
      
      // Invalidate list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.locations() });
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.combined() });
    }
  });
};

/**
 * Hook to delete a location
 */
export const useDeleteLocation = (taxonomyApi: TaxonomyAPI) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => taxonomyApi.locations.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ 
        queryKey: TAXONOMY_QUERY_KEYS.locationsDetail(deletedId) 
      });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.locations() });
      queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.combined() });
    }
  });
};

/**
 * Utility function to invalidate all taxonomy-related queries
 */
export const useInvalidateTaxonomyQueries = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: TAXONOMY_QUERY_KEYS.all });
  };
};