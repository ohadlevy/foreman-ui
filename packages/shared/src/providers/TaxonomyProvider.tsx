import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useTaxonomyStore } from '../stores/taxonomyStore';
import { useAuthStore } from '../auth/store';
import type { 
  TaxonomyContext as TaxonomyContextType, 
  TaxonomyPermissions,
  EnhancedOrganization,
  EnhancedLocation
} from '../types/taxonomy';
import { TAXONOMY_PERMISSIONS } from '../constants/taxonomy';

/**
 * Sanitizes error messages to prevent sensitive information exposure
 */
const sanitizeErrorMessage = (message: string): string => {
  return message.replace(/token=\S+/gi, 'token=***');
};

/**
 * Taxonomy provider context interface
 */
interface TaxonomyProviderContextType {
  context: TaxonomyContextType;
  permissions: TaxonomyPermissions;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Initialization functions
  initializeTaxonomy: () => Promise<void>;
  refreshTaxonomy: () => Promise<void>;
  
  // Selection functions
  switchToOrganization: (organization: EnhancedOrganization) => void;
  switchToLocation: (location: EnhancedLocation) => void;
  clearSelection: () => void;
}

/**
 * React context for taxonomy provider
 */
const TaxonomyProviderContext = createContext<TaxonomyProviderContextType | null>(null);

/**
 * Hook to use taxonomy provider context
 */
export const useTaxonomyProvider = (): TaxonomyProviderContextType => {
  const context = useContext(TaxonomyProviderContext);
  if (!context) {
    throw new Error('useTaxonomyProvider must be used within a TaxonomyProvider');
  }
  return context;
};

/**
 * Props for TaxonomyProvider component
 */
interface TaxonomyProviderProps {
  children: React.ReactNode;
  
  // Optional API functions for fetching data
  fetchOrganizations?: () => Promise<EnhancedOrganization[]>;
  fetchLocations?: () => Promise<EnhancedLocation[]>;
  
  // Optional initialization options
  autoInitialize?: boolean;
  defaultOrganizationId?: number;
  defaultLocationId?: number;
}

/**
 * Taxonomy provider component that manages taxonomy state and initialization
 */
export const TaxonomyProvider: React.FC<TaxonomyProviderProps> = ({
  children,
  fetchOrganizations,
  fetchLocations,
  autoInitialize = true,
  defaultOrganizationId,
  defaultLocationId
}) => {
  // Zustand store hooks
  const {
    context,
    permissions,
    isLoading,
    error,
    isInitialized,
    setLoading,
    setError,
    setInitialized,
    setAvailableOrganizations,
    setAvailableLocations,
    setCurrentOrganization,
    setCurrentLocation,
    setPermissions,
    resetSelection
  } = useTaxonomyStore();

  // Auth store for user permissions
  const { user, hasPermission } = useAuthStore();

  /**
   * Calculate taxonomy permissions based on user permissions
   */
  const calculatePermissions = useCallback((): TaxonomyPermissions => {
    if (!user) {
      return {
        canViewOrganizations: false,
        canEditOrganizations: false,
        canCreateOrganizations: false,
        canDeleteOrganizations: false,
        canViewLocations: false,
        canEditLocations: false,
        canCreateLocations: false,
        canDeleteLocations: false,
        canSwitchContext: false
      };
    }

    return {
      canViewOrganizations: hasPermission(TAXONOMY_PERMISSIONS.ORGANIZATION.VIEW),
      canEditOrganizations: hasPermission(TAXONOMY_PERMISSIONS.ORGANIZATION.EDIT),
      canCreateOrganizations: hasPermission(TAXONOMY_PERMISSIONS.ORGANIZATION.CREATE),
      canDeleteOrganizations: hasPermission(TAXONOMY_PERMISSIONS.ORGANIZATION.DELETE),
      canViewLocations: hasPermission(TAXONOMY_PERMISSIONS.LOCATION.VIEW),
      canEditLocations: hasPermission(TAXONOMY_PERMISSIONS.LOCATION.EDIT),
      canCreateLocations: hasPermission(TAXONOMY_PERMISSIONS.LOCATION.CREATE),
      canDeleteLocations: hasPermission(TAXONOMY_PERMISSIONS.LOCATION.DELETE),
      canSwitchContext: hasPermission(TAXONOMY_PERMISSIONS.ORGANIZATION.VIEW) || 
                       hasPermission(TAXONOMY_PERMISSIONS.LOCATION.VIEW)
    };
  }, [user, hasPermission]);

  /**
   * Initialize taxonomy data
   */
  const initializeTaxonomy = useCallback(async (): Promise<void> => {
    if (isInitialized || isLoading) return;

    setLoading(true);
    setError(null);

    try {
      // Update permissions based on current user
      const userPermissions = calculatePermissions();
      setPermissions(userPermissions);

      // Fetch available organizations and locations
      const [organizations, locations] = await Promise.all([
        fetchOrganizations ? fetchOrganizations() : Promise.resolve([]),
        fetchLocations ? fetchLocations() : Promise.resolve([])
      ]);

      setAvailableOrganizations(organizations);
      setAvailableLocations(locations);

      // Set default selections if provided and available
      if (defaultOrganizationId && organizations.length > 0) {
        const defaultOrg = organizations.find(org => org.id === defaultOrganizationId);
        if (defaultOrg) {
          setCurrentOrganization(defaultOrg);
        }
      }

      if (defaultLocationId && locations.length > 0) {
        const defaultLoc = locations.find(loc => loc.id === defaultLocationId);
        if (defaultLoc) {
          setCurrentLocation(defaultLoc);
        }
      }

      // If user has default assignments, use those
      if (user) {
        if (user.organizations?.length > 0 && !context.organization) {
          const userDefaultOrg = organizations.find(org => 
            user.organizations.some(userOrg => userOrg.id === org.id)
          );
          if (userDefaultOrg) {
            setCurrentOrganization(userDefaultOrg);
          }
        }

        if (user.locations?.length > 0 && !context.location) {
          const userDefaultLoc = locations.find(loc => 
            user.locations.some(userLoc => userLoc.id === loc.id)
          );
          if (userDefaultLoc) {
            setCurrentLocation(userDefaultLoc);
          }
        }
      }

      setInitialized(true);
    } catch (err) {
      // Sanitize error message to prevent sensitive information exposure
      const errorMessage = err instanceof Error 
        ? sanitizeErrorMessage(err.message)
        : 'Failed to initialize taxonomy';
      setError(errorMessage);
      
      // Log sanitized error (avoid logging sensitive details in production)
      if (process.env.NODE_ENV === 'development') {
        console.error('Taxonomy initialization failed:', err);
      } else {
        console.error('Taxonomy initialization failed:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [
    isInitialized,
    isLoading,
    calculatePermissions,
    fetchOrganizations,
    fetchLocations,
    defaultOrganizationId,
    defaultLocationId,
    user,
    context.organization,
    context.location,
    setLoading,
    setError,
    setPermissions,
    setAvailableOrganizations,
    setAvailableLocations,
    setCurrentOrganization,
    setCurrentLocation,
    setInitialized
  ]);

  /**
   * Refresh taxonomy data
   */
  const refreshTaxonomy = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [organizations, locations] = await Promise.all([
        fetchOrganizations ? fetchOrganizations() : Promise.resolve([]),
        fetchLocations ? fetchLocations() : Promise.resolve([])
      ]);

      setAvailableOrganizations(organizations);
      setAvailableLocations(locations);

      // Update permissions
      const userPermissions = calculatePermissions();
      setPermissions(userPermissions);
    } catch (err) {
      // Sanitize error message to prevent sensitive information exposure
      const errorMessage = err instanceof Error 
        ? sanitizeErrorMessage(err.message)
        : 'Failed to refresh taxonomy';
      setError(errorMessage);
      
      // Log sanitized error (avoid logging sensitive details in production)
      if (process.env.NODE_ENV === 'development') {
        console.error('Taxonomy refresh failed:', err);
      } else {
        console.error('Taxonomy refresh failed:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [
    calculatePermissions,
    fetchOrganizations,
    fetchLocations,
    setLoading,
    setError,
    setAvailableOrganizations,
    setAvailableLocations,
    setPermissions
  ]);

  /**
   * Switch to a specific organization
   */
  const switchToOrganization = useCallback((organization: EnhancedOrganization): void => {
    if (!permissions.canSwitchContext) {
      console.warn('User does not have permission to switch taxonomy context');
      return;
    }

    setCurrentOrganization(organization);
  }, [permissions.canSwitchContext, setCurrentOrganization]);

  /**
   * Switch to a specific location
   */
  const switchToLocation = useCallback((location: EnhancedLocation): void => {
    if (!permissions.canSwitchContext) {
      console.warn('User does not have permission to switch taxonomy context');
      return;
    }

    setCurrentLocation(location);
  }, [permissions.canSwitchContext, setCurrentLocation]);

  /**
   * Clear current selection
   */
  const clearSelection = useCallback((): void => {
    if (!permissions.canSwitchContext) {
      console.warn('User does not have permission to switch taxonomy context');
      return;
    }

    resetSelection();
  }, [permissions.canSwitchContext, resetSelection]);

  /**
   * Auto-initialize when component mounts or user changes
   */
  useEffect(() => {
    if (autoInitialize && user && !isInitialized) {
      initializeTaxonomy();
    }
  }, [autoInitialize, user, isInitialized, initializeTaxonomy]);

  /**
   * Update permissions when user changes
   */
  useEffect(() => {
    if (user) {
      const userPermissions = calculatePermissions();
      setPermissions(userPermissions);
    }
  }, [user, calculatePermissions, setPermissions]);

  /**
   * Memoized context value
   */
  const contextValue = useMemo((): TaxonomyProviderContextType => ({
    context,
    permissions,
    isLoading,
    error,
    isInitialized,
    initializeTaxonomy,
    refreshTaxonomy,
    switchToOrganization,
    switchToLocation,
    clearSelection
  }), [
    context,
    permissions,
    isLoading,
    error,
    isInitialized,
    initializeTaxonomy,
    refreshTaxonomy,
    switchToOrganization,
    switchToLocation,
    clearSelection
  ]);

  return (
    <TaxonomyProviderContext.Provider value={contextValue}>
      {children}
    </TaxonomyProviderContext.Provider>
  );
};

/**
 * HOC for wrapping components with taxonomy provider
 */
export const withTaxonomyProvider = <P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<TaxonomyProviderProps, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <TaxonomyProvider {...providerProps}>
      <Component {...props} />
    </TaxonomyProvider>
  );

  WrappedComponent.displayName = `withTaxonomyProvider(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};