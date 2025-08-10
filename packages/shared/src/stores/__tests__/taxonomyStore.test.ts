import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import type { 
  EnhancedOrganization, 
  EnhancedLocation, 
  TaxonomySelection 
} from '../../types/taxonomy';
import { useTaxonomyStore } from '../taxonomyStore';

// Mock data
const mockOrganizations: EnhancedOrganization[] = [
  {
    id: 1,
    name: 'Org 1',
    title: 'Organization 1',
    description: 'First organization',
    hosts_count: 10,
    users_count: 5
  },
  {
    id: 2,
    name: 'Org 2', 
    title: 'Organization 1 / Organization 2',
    description: 'Child organization',
    hosts_count: 5,
    users_count: 3
  }
];

const mockLocations: EnhancedLocation[] = [
  {
    id: 1,
    name: 'Loc 1',
    title: 'Location 1',
    description: 'First location',
    hosts_count: 8,
    users_count: 4
  },
  {
    id: 2,
    name: 'Loc 2',
    title: 'Location 1 / Location 2', 
    description: 'Child location',
    hosts_count: 3,
    users_count: 2
  }
];

describe('taxonomyStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTaxonomyStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useTaxonomyStore.getState();
      
      expect(state.context.organization).toBeUndefined();
      expect(state.context.location).toBeUndefined();
      expect(state.context.availableOrganizations).toEqual([]);
      expect(state.context.availableLocations).toEqual([]);
      expect(state.context.isLoading).toBe(false);
      expect(state.context.error).toBeUndefined();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.pendingSelection).toBeNull();
      expect(state.isInitialized).toBe(false);
    });

    it('should have all permissions disabled by default', () => {
      const state = useTaxonomyStore.getState();
      
      expect(state.permissions.canViewOrganizations).toBe(false);
      expect(state.permissions.canEditOrganizations).toBe(false);
      expect(state.permissions.canCreateOrganizations).toBe(false);
      expect(state.permissions.canDeleteOrganizations).toBe(false);
      expect(state.permissions.canViewLocations).toBe(false);
      expect(state.permissions.canEditLocations).toBe(false);
      expect(state.permissions.canCreateLocations).toBe(false);
      expect(state.permissions.canDeleteLocations).toBe(false);
      expect(state.permissions.canSwitchContext).toBe(false);
    });
  });

  describe('available entities management', () => {
    it('should set available organizations', () => {
      const { setAvailableOrganizations } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableOrganizations(mockOrganizations);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.availableOrganizations).toEqual(mockOrganizations);
    });

    it('should set available locations', () => {
      const { setAvailableLocations } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableLocations(mockLocations);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.availableLocations).toEqual(mockLocations);
    });

    it('should update existing organization', () => {
      const { setAvailableOrganizations, updateOrganization } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableOrganizations(mockOrganizations);
      });
      
      const updatedOrg: EnhancedOrganization = {
        ...mockOrganizations[0],
        hosts_count: 20,
        description: 'Updated description'
      };
      
      act(() => {
        updateOrganization(updatedOrg);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.availableOrganizations[0]).toEqual(updatedOrg);
    });

    it('should update existing location', () => {
      const { setAvailableLocations, updateLocation } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableLocations(mockLocations);
      });
      
      const updatedLoc: EnhancedLocation = {
        ...mockLocations[0],
        hosts_count: 15,
        description: 'Updated location description'
      };
      
      act(() => {
        updateLocation(updatedLoc);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.availableLocations[0]).toEqual(updatedLoc);
    });
  });

  describe('current selection management', () => {
    beforeEach(() => {
      const { setAvailableOrganizations, setAvailableLocations } = useTaxonomyStore.getState();
      act(() => {
        setAvailableOrganizations(mockOrganizations);
        setAvailableLocations(mockLocations);
      });
    });

    it('should set current organization', () => {
      const { setCurrentOrganization } = useTaxonomyStore.getState();
      
      act(() => {
        setCurrentOrganization(mockOrganizations[0]);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.organization).toEqual(mockOrganizations[0]);
    });

    it('should set current location', () => {
      const { setCurrentLocation } = useTaxonomyStore.getState();
      
      act(() => {
        setCurrentLocation(mockLocations[0]);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.location).toEqual(mockLocations[0]);
    });

    it('should set selection by IDs', () => {
      const { setSelection } = useTaxonomyStore.getState();
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };
      
      act(() => {
        setSelection(selection);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.organization?.id).toBe(1);
      expect(state.context.location?.id).toBe(2);
    });

    it('should reset selection', () => {
      const { setSelection, resetSelection } = useTaxonomyStore.getState();
      
      // First set a selection
      act(() => {
        setSelection({ organizationId: 1, locationId: 1 });
      });
      
      // Then reset
      act(() => {
        resetSelection();
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.organization).toBeUndefined();
      expect(state.context.location).toBeUndefined();
      expect(state.pendingSelection).toBeNull();
    });
  });

  describe('pending selection management', () => {
    it('should set and commit pending selection', () => {
      const { setAvailableOrganizations, setPendingSelection, commitPendingSelection } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableOrganizations(mockOrganizations);
      });
      
      const pendingSelection: TaxonomySelection = { organizationId: 1 };
      
      act(() => {
        setPendingSelection(pendingSelection);
      });
      
      let state = useTaxonomyStore.getState();
      expect(state.pendingSelection).toEqual(pendingSelection);
      
      act(() => {
        commitPendingSelection();
      });
      
      state = useTaxonomyStore.getState();
      expect(state.context.organization?.id).toBe(1);
      expect(state.pendingSelection).toBeNull();
    });

    it('should clear pending selection', () => {
      const { setPendingSelection } = useTaxonomyStore.getState();
      
      act(() => {
        setPendingSelection({ organizationId: 1 });
      });
      
      act(() => {
        setPendingSelection(null);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.pendingSelection).toBeNull();
    });
  });

  describe('permissions management', () => {
    it('should set permissions', () => {
      const { setPermissions } = useTaxonomyStore.getState();
      const permissions = {
        canViewOrganizations: true,
        canEditOrganizations: false,
        canCreateOrganizations: false,
        canDeleteOrganizations: false,
        canViewLocations: true,
        canEditLocations: true,
        canCreateLocations: false,
        canDeleteLocations: false,
        canSwitchContext: true
      };
      
      act(() => {
        setPermissions(permissions);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.permissions).toEqual(permissions);
    });

    it('should check if user can switch to organization', () => {
      const { setAvailableOrganizations, setPermissions, canSwitchToOrganization } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableOrganizations(mockOrganizations);
        setPermissions({
          canViewOrganizations: true,
          canEditOrganizations: false,
          canCreateOrganizations: false,
          canDeleteOrganizations: false,
          canViewLocations: false,
          canEditLocations: false,
          canCreateLocations: false,
          canDeleteLocations: false,
          canSwitchContext: true
        });
      });
      
      expect(canSwitchToOrganization(1)).toBe(true);
      expect(canSwitchToOrganization(999)).toBe(false);
    });

    it('should deny switch if no permission', () => {
      const { setAvailableOrganizations, canSwitchToOrganization } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableOrganizations(mockOrganizations);
        // Don't set canSwitchContext permission
      });
      
      expect(canSwitchToOrganization(1)).toBe(false);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      const { setAvailableOrganizations, setAvailableLocations } = useTaxonomyStore.getState();
      act(() => {
        setAvailableOrganizations(mockOrganizations);
        setAvailableLocations(mockLocations);
      });
    });

    it('should validate current selection as valid', () => {
      const { setSelection, validateCurrentSelection } = useTaxonomyStore.getState();
      
      act(() => {
        setSelection({ organizationId: 1, locationId: 1 });
      });
      
      const validation = validateCurrentSelection();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate current selection as invalid', () => {
      const { setCurrentOrganization, validateCurrentSelection } = useTaxonomyStore.getState();
      
      // Set an organization that doesn't exist in available organizations (mock scenario)
      const invalidOrg: EnhancedOrganization = {
        id: 999,
        name: 'Invalid Org',
        title: 'Invalid Organization'
      };
      
      act(() => {
        setCurrentOrganization(invalidOrg);
      });
      
      const validation = validateCurrentSelection();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should check if has valid selection', () => {
      const { setSelection, hasValidSelection } = useTaxonomyStore.getState();
      
      act(() => {
        setSelection({ organizationId: 1 });
      });
      
      expect(hasValidSelection()).toBe(true);
    });
  });


  describe('computed values', () => {
    beforeEach(() => {
      const { setAvailableOrganizations, setAvailableLocations } = useTaxonomyStore.getState();
      act(() => {
        setAvailableOrganizations(mockOrganizations);
        setAvailableLocations(mockLocations);
      });
    });

    it('should get current selection', () => {
      const { setSelection, getCurrentSelection } = useTaxonomyStore.getState();
      
      act(() => {
        setSelection({ organizationId: 1, locationId: 2 });
      });
      
      const selection = getCurrentSelection();
      expect(selection).toEqual({ organizationId: 1, locationId: 2 });
    });

    it('should get selected organization name', () => {
      const { setCurrentOrganization, getSelectedOrganizationName } = useTaxonomyStore.getState();
      
      act(() => {
        setCurrentOrganization(mockOrganizations[0]);
      });
      
      const name = getSelectedOrganizationName();
      expect(name).toBe('Organization 1');
    });

    it('should get selected location name', () => {
      const { setCurrentLocation, getSelectedLocationName } = useTaxonomyStore.getState();
      
      act(() => {
        setCurrentLocation(mockLocations[0]);
      });
      
      const name = getSelectedLocationName();
      expect(name).toBe('Location 1');
    });

    it('should return empty string for no selection', () => {
      const { getSelectedOrganizationName, getSelectedLocationName } = useTaxonomyStore.getState();
      
      expect(getSelectedOrganizationName()).toBe('');
      expect(getSelectedLocationName()).toBe('');
    });
  });

  describe('state management', () => {
    it('should set loading state', () => {
      const { setLoading } = useTaxonomyStore.getState();
      
      act(() => {
        setLoading(true);
      });
      
      let state = useTaxonomyStore.getState();
      expect(state.isLoading).toBe(true);
      
      act(() => {
        setLoading(false);
      });
      
      state = useTaxonomyStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useTaxonomyStore.getState();
      const errorMessage = 'Test error';
      
      act(() => {
        setError(errorMessage);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false); // Should clear loading state
    });

    it('should set initialized state', () => {
      const { setInitialized } = useTaxonomyStore.getState();
      
      act(() => {
        setInitialized(true);
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('context validation', () => {
    it('should prevent setting organization not in available organizations', () => {
      const { setAvailableOrganizations, setContext } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableOrganizations(mockOrganizations);
      });
      
      const invalidOrg: EnhancedOrganization = {
        id: 999,
        name: 'Invalid Org',
        title: 'Invalid Organization'
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      act(() => {
        setContext({
          organization: invalidOrg,
          availableOrganizations: mockOrganizations
        });
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Cannot set organization that is not in available organizations');
      
      const state = useTaxonomyStore.getState();
      expect(state.context.organization).toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    it('should prevent setting location not in available locations', () => {
      const { setAvailableLocations, setContext } = useTaxonomyStore.getState();
      
      act(() => {
        setAvailableLocations(mockLocations);
      });
      
      const invalidLoc: EnhancedLocation = {
        id: 999,
        name: 'Invalid Loc',
        title: 'Invalid Location'
      };
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      act(() => {
        setContext({
          location: invalidLoc,
          availableLocations: mockLocations
        });
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Cannot set location that is not in available locations');
      
      const state = useTaxonomyStore.getState();
      expect(state.context.location).toBeUndefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      const { 
        setAvailableOrganizations, 
        setCurrentOrganization, 
        setLoading, 
        setError,
        setInitialized,
        reset 
      } = useTaxonomyStore.getState();
      
      // Set some state
      act(() => {
        setAvailableOrganizations(mockOrganizations);
        setCurrentOrganization(mockOrganizations[0]);
        setLoading(true);
        setError('Test error');
        setInitialized(true);
      });
      
      // Reset
      act(() => {
        reset();
      });
      
      const state = useTaxonomyStore.getState();
      expect(state.context.organization).toBeUndefined();
      expect(state.context.availableOrganizations).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('selector hooks', () => {
    it('should provide selector hooks', async () => {
      const {
        useTaxonomyContext,
        useTaxonomyPermissions,
        useTaxonomySelection,
        useTaxonomyError,
        useTaxonomyLoading,
        useTaxonomyActions
      } = await import('../taxonomyStore');
      
      expect(typeof useTaxonomyContext).toBe('function');
      expect(typeof useTaxonomyPermissions).toBe('function');
      expect(typeof useTaxonomySelection).toBe('function');
      expect(typeof useTaxonomyError).toBe('function');
      expect(typeof useTaxonomyLoading).toBe('function');
      expect(typeof useTaxonomyActions).toBe('function');
    });
  });
});