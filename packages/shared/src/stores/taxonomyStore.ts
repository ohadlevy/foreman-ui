import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EnhancedOrganization,
  EnhancedLocation,
  TaxonomyContext,
  TaxonomySelection,
  TaxonomyPermissions
} from '../types/taxonomy';
import { 
  TAXONOMY_STORAGE_KEYS
} from '../constants/taxonomy';

/**
 * Error messages for taxonomy operations
 */
const ERROR_MESSAGES = {
  INVALID_ORGANIZATION: 'Cannot set organization that is not in available organizations',
  INVALID_LOCATION: 'Cannot set location that is not in available locations',
  INITIALIZATION_FAILED: 'Failed to initialize taxonomy',
  REFRESH_FAILED: 'Failed to refresh taxonomy'
} as const;

import { validateTaxonomySelection } from '../utils/taxonomyHelpers';

/**
 * Taxonomy store state interface
 */
interface TaxonomyState {
  // Current context
  context: TaxonomyContext;
  
  // User permissions for taxonomy operations
  permissions: TaxonomyPermissions;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Selection state for components
  pendingSelection: TaxonomySelection | null;
  
  // Initialization state
  isInitialized: boolean;
}

/**
 * Taxonomy store actions interface
 */
interface TaxonomyActions {
  // Context management
  setContext: (context: Partial<TaxonomyContext>) => void;
  setCurrentOrganization: (organization: EnhancedOrganization | undefined) => void;
  setCurrentLocation: (location: EnhancedLocation | undefined) => void;
  
  // Available entities management
  setAvailableOrganizations: (organizations: EnhancedOrganization[]) => void;
  setAvailableLocations: (locations: EnhancedLocation[]) => void;
  updateOrganization: (organization: EnhancedOrganization) => void;
  updateLocation: (location: EnhancedLocation) => void;
  
  // Selection management
  setSelection: (selection: TaxonomySelection) => void;
  setPendingSelection: (selection: TaxonomySelection | null) => void;
  commitPendingSelection: () => void;
  resetSelection: () => void;
  
  // Permissions management
  setPermissions: (permissions: TaxonomyPermissions) => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Validation and utilities
  validateCurrentSelection: () => { isValid: boolean; errors: string[]; warnings: string[] };
  canSwitchToOrganization: (organizationId: number) => boolean;
  canSwitchToLocation: (locationId: number) => boolean;
  
  // Computed values
  getCurrentSelection: () => TaxonomySelection;
  hasValidSelection: () => boolean;
  getSelectedOrganizationName: () => string;
  getSelectedLocationName: () => string;
  
  // Reset functionality
  reset: () => void;
}

/**
 * Combined taxonomy store interface
 */
export type TaxonomyStore = TaxonomyState & TaxonomyActions;

/**
 * Default permissions (all false - will be updated based on user permissions)
 */
const defaultPermissions: TaxonomyPermissions = {
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

/**
 * Create the taxonomy store using Zustand with persistence
 */
export const useTaxonomyStore = create<TaxonomyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      context: {
        organization: undefined,
        location: undefined,
        availableOrganizations: [],
        availableLocations: [],
        isLoading: false,
        error: undefined
      },
      permissions: { ...defaultPermissions },
      isLoading: false,
      error: null,
      pendingSelection: null,
      isInitialized: false,

      // Context management actions
      setContext: (contextUpdate: Partial<TaxonomyContext>) => {
        const currentContext = get().context;
        
        // Validate context update to prevent invalid state combinations
        // Check organization against current available organizations or updated ones
        if (contextUpdate.organization) {
          const availableOrgs = contextUpdate.availableOrganizations || currentContext.availableOrganizations;
          // Use Set for O(1) lookup performance instead of linear search
          const orgIdSet = new Set(availableOrgs.map(org => org.id));
          if (!orgIdSet.has(contextUpdate.organization.id)) {
            console.warn(ERROR_MESSAGES.INVALID_ORGANIZATION);
            return;
          }
        }
        
        // Check location against current available locations or updated ones
        if (contextUpdate.location) {
          const availableLocs = contextUpdate.availableLocations || currentContext.availableLocations;
          // Use Set for O(1) lookup performance instead of linear search
          const locIdSet = new Set(availableLocs.map(loc => loc.id));
          if (!locIdSet.has(contextUpdate.location.id)) {
            console.warn(ERROR_MESSAGES.INVALID_LOCATION);
            return;
          }
        }
        
        const newContext = { ...currentContext, ...contextUpdate };
        set({ context: newContext, error: null });
      },

      setCurrentOrganization: (organization: EnhancedOrganization | undefined) => {
        const { context } = get();
        
        set({
          context: {
            ...context,
            organization,
            error: undefined
          },
          error: null
        });
      },

      setCurrentLocation: (location: EnhancedLocation | undefined) => {
        const { context } = get();
        
        set({
          context: {
            ...context,
            location,
            error: undefined
          },
          error: null
        });
      },

      // Available entities management
      setAvailableOrganizations: (organizations: EnhancedOrganization[]) => {
        const { context } = get();
        set({
          context: {
            ...context,
            availableOrganizations: organizations
          }
        });
      },

      setAvailableLocations: (locations: EnhancedLocation[]) => {
        const { context } = get();
        set({
          context: {
            ...context,
            availableLocations: locations
          }
        });
      },

      updateOrganization: (organization: EnhancedOrganization) => {
        const { context } = get();
        const updatedOrgs = context.availableOrganizations.map(org =>
          org.id === organization.id ? organization : org
        );
        
        set({
          context: {
            ...context,
            availableOrganizations: updatedOrgs,
            organization: context.organization?.id === organization.id ? organization : context.organization
          }
        });
      },

      updateLocation: (location: EnhancedLocation) => {
        const { context } = get();
        const updatedLocs = context.availableLocations.map(loc =>
          loc.id === location.id ? location : loc
        );
        
        set({
          context: {
            ...context,
            availableLocations: updatedLocs,
            location: context.location?.id === location.id ? location : context.location
          }
        });
      },

      // Selection management
      setSelection: (selection: TaxonomySelection) => {
        const { context } = get();
        
        // Use Map for O(1) lookup performance instead of linear searches
        const orgMap = new Map(context.availableOrganizations.map(org => [org.id, org]));
        const locMap = new Map(context.availableLocations.map(loc => [loc.id, loc]));
        
        // Find the entities based on selection using optimized lookups
        const organization = selection.organizationId 
          ? orgMap.get(selection.organizationId)
          : undefined;
          
        const location = selection.locationId
          ? locMap.get(selection.locationId)
          : undefined;

        // Update both organization and location atomically via direct set() call
        set({
          context: {
            ...context,
            organization,
            location,
            error: undefined
          },
          pendingSelection: null,
          error: null
        });
      },

      setPendingSelection: (selection: TaxonomySelection | null) => {
        set({ pendingSelection: selection });
      },

      commitPendingSelection: () => {
        const { pendingSelection, context } = get();
        if (pendingSelection) {
          // Use Map for O(1) lookup performance instead of linear searches
          const orgMap = new Map(context.availableOrganizations.map(org => [org.id, org]));
          const locMap = new Map(context.availableLocations.map(loc => [loc.id, loc]));
          
          // Find the entities based on pending selection using optimized lookups
          const organization = pendingSelection.organizationId 
            ? orgMap.get(pendingSelection.organizationId)
            : undefined;
            
          const location = pendingSelection.locationId
            ? locMap.get(pendingSelection.locationId)
            : undefined;

          // Apply the pending selection atomically
          set({
            context: {
              ...context,
              organization,
              location,
              error: undefined
            },
            pendingSelection: null,
            error: null
          });
        }
      },

      resetSelection: () => {
        const { context } = get();
        set({
          context: {
            ...context,
            organization: undefined,
            location: undefined
          },
          pendingSelection: null
        });
      },

      // Permissions management
      setPermissions: (permissions: TaxonomyPermissions) => {
        set({ permissions });
      },

      // State management
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      setInitialized: (isInitialized: boolean) => {
        set({ isInitialized });
      },

      // Validation and utilities
      validateCurrentSelection: () => {
        const { context } = get();
        const selection = {
          organizationId: context.organization?.id,
          locationId: context.location?.id
        };
        return validateTaxonomySelection(
          selection,
          context.availableOrganizations,
          context.availableLocations
        );
      },

      canSwitchToOrganization: (organizationId: number) => {
        const { context, permissions } = get();
        if (!permissions.canSwitchContext) return false;
        // Use Set for O(1) lookup performance
        const orgIdSet = new Set(context.availableOrganizations.map(org => org.id));
        return orgIdSet.has(organizationId);
      },

      canSwitchToLocation: (locationId: number) => {
        const { context, permissions } = get();
        if (!permissions.canSwitchContext) return false;
        // Use Set for O(1) lookup performance
        const locIdSet = new Set(context.availableLocations.map(loc => loc.id));
        return locIdSet.has(locationId);
      },

      // Computed values
      getCurrentSelection: (): TaxonomySelection => {
        const { context } = get();
        return {
          organizationId: context.organization?.id,
          locationId: context.location?.id
        };
      },

      hasValidSelection: () => {
        const { context } = get();
        const selection = {
          organizationId: context.organization?.id,
          locationId: context.location?.id
        };
        const validation = validateTaxonomySelection(
          selection,
          context.availableOrganizations,
          context.availableLocations
        );
        return validation.isValid;
      },

      getSelectedOrganizationName: () => {
        const { context } = get();
        return context.organization?.title || context.organization?.name || '';
      },

      getSelectedLocationName: () => {
        const { context } = get();
        return context.location?.title || context.location?.name || '';
      },

      // Reset functionality
      reset: () => {
        set({
          context: {
            organization: undefined,
            location: undefined,
            availableOrganizations: [],
            availableLocations: [],
            isLoading: false,
            error: undefined
          },
          permissions: { ...defaultPermissions },
          isLoading: false,
          error: null,
          pendingSelection: null,
          isInitialized: false
        });
      }
    }),
    {
      name: TAXONOMY_STORAGE_KEYS.TAXONOMY_PREFERENCES,
      partialize: (state) => ({
        // Persist current selection and UI preferences
        context: {
          organization: state.context.organization,
          location: state.context.location
        }
        // Don't persist loading states, errors, or available entities
      }),
      
      // Custom merge function to handle initialization
      merge: (persistedState, currentState) => {
        const merged = { 
          ...currentState, 
          ...(persistedState && typeof persistedState === 'object' ? persistedState : {})
        };
        
        // If we have persisted selection IDs, we'll need to restore them
        // when available entities are loaded (this will be handled by initialization logic)
        
        return merged;
      }
    }
  )
);

/**
 * Selector hooks for common use cases
 */
export const useTaxonomyContext = () => useTaxonomyStore(state => state.context);
export const useTaxonomyPermissions = () => useTaxonomyStore(state => state.permissions);
export const useTaxonomySelection = () => useTaxonomyStore(state => state.getCurrentSelection());
export const useTaxonomyError = () => useTaxonomyStore(state => state.error);
export const useTaxonomyLoading = () => useTaxonomyStore(state => state.isLoading);

/**
 * Action selectors for components
 */
export const useTaxonomyActions = () => useTaxonomyStore(state => ({
  setSelection: state.setSelection,
  setCurrentOrganization: state.setCurrentOrganization,
  setCurrentLocation: state.setCurrentLocation,
  resetSelection: state.resetSelection,
  validateCurrentSelection: state.validateCurrentSelection
}));