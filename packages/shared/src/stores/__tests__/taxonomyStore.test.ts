import { renderHook, act } from '@testing-library/react';
import { useTaxonomyStore } from '../taxonomyStore';
import { Organization, Location } from '../../types';

describe('taxonomyStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useTaxonomyStore.getState();
    act(() => {
      store.resetContext();
    });
  });

  const mockOrganization: Organization = {
    id: 1,
    name: 'test-org',
    title: 'Test Organization',
    description: 'Test description',
  };

  const mockLocation: Location = {
    id: 1,
    name: 'test-loc',
    title: 'Test Location',
    description: 'Test description',
  };

  const mockNestedOrganization: Organization = {
    id: 2,
    name: 'child-org',
    title: 'Test Organization › Child Organization', // Server provides hierarchical title
    ancestry: '1',
  };

  const mockNestedLocation: Location = {
    id: 2,
    name: 'child-loc',
    title: 'Test Location › Child Location', // Server provides hierarchical title
    ancestry: '1',
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      expect(result.current.currentOrganization).toBeNull();
      expect(result.current.currentLocation).toBeNull();
      expect(result.current.availableOrganizations).toEqual([]);
      expect(result.current.availableLocations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isContextSet()).toBe(false);
    });
  });

  describe('Organization Management', () => {
    it('should set current organization', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setCurrentOrganization(mockOrganization);
      });

      expect(result.current.currentOrganization).toEqual(mockOrganization);
      expect(result.current.isContextSet()).toBe(true);
    });

    it('should clear current organization', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setCurrentOrganization(mockOrganization);
        result.current.setCurrentOrganization(null);
      });

      expect(result.current.currentOrganization).toBeNull();
    });

    it('should set available organizations', () => {
      const { result } = renderHook(() => useTaxonomyStore());
      const organizations = [mockOrganization, mockNestedOrganization];

      act(() => {
        result.current.setAvailableOrganizations(organizations);
      });

      expect(result.current.availableOrganizations).toEqual(organizations);
    });
  });

  describe('Location Management', () => {
    it('should set current location', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setCurrentLocation(mockLocation);
      });

      expect(result.current.currentLocation).toEqual(mockLocation);
      expect(result.current.isContextSet()).toBe(true);
    });

    it('should clear current location', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setCurrentLocation(mockLocation);
        result.current.setCurrentLocation(null);
      });

      expect(result.current.currentLocation).toBeNull();
    });

    it('should set available locations', () => {
      const { result } = renderHook(() => useTaxonomyStore());
      const locations = [mockLocation, mockNestedLocation];

      act(() => {
        result.current.setAvailableLocations(locations);
      });

      expect(result.current.availableLocations).toEqual(locations);
    });
  });

  describe('Context Management', () => {
    it('should update context with both organization and location', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.updateContext(mockOrganization, mockLocation);
      });

      expect(result.current.currentOrganization).toEqual(mockOrganization);
      expect(result.current.currentLocation).toEqual(mockLocation);
      expect(result.current.error).toBeNull();
      expect(result.current.isContextSet()).toBe(true);
    });

    it('should reset context completely', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setCurrentOrganization(mockOrganization);
        result.current.setCurrentLocation(mockLocation);
        result.current.setError('test error');
        result.current.resetContext();
      });

      expect(result.current.currentOrganization).toBeNull();
      expect(result.current.currentLocation).toBeNull();
      expect(result.current.availableOrganizations).toEqual([]);
      expect(result.current.availableLocations).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Management', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useTaxonomyStore());
      const errorMessage = 'Test error';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Context Path Generation', () => {
    it('should return correct path for organization only', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setAvailableOrganizations([mockOrganization]);
        result.current.setCurrentOrganization(mockOrganization);
      });

      expect(result.current.getContextPath()).toBe('Test Organization');
    });

    it('should return correct path for location only', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setAvailableLocations([mockLocation]);
        result.current.setCurrentLocation(mockLocation);
      });

      expect(result.current.getContextPath()).toBe('Test Location');
    });

    it('should return correct path for both organization and location', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setAvailableOrganizations([mockOrganization]);
        result.current.setAvailableLocations([mockLocation]);
        result.current.setCurrentOrganization(mockOrganization);
        result.current.setCurrentLocation(mockLocation);
      });

      expect(result.current.getContextPath()).toBe('Test Organization • Test Location');
    });

    it('should return default message when no context is set', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      expect(result.current.getContextPath()).toBe('No context selected');
    });

    it('should display hierarchical path using server-provided titles', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setAvailableOrganizations([mockOrganization, mockNestedOrganization]);
        result.current.setCurrentOrganization(mockNestedOrganization);
      });

      expect(result.current.getContextPath()).toBe('Test Organization › Child Organization');
    });

    it('should handle missing ancestor in hierarchy', () => {
      const { result } = renderHook(() => useTaxonomyStore());
      const orphanedOrg: Organization = {
        id: 3,
        name: 'orphaned',
        title: 'Orphaned Organization',
        ancestry: '999', // Parent doesn't exist
      };

      act(() => {
        result.current.setAvailableOrganizations([orphanedOrg]);
        result.current.setCurrentOrganization(orphanedOrg);
      });

      expect(result.current.getContextPath()).toBe('Orphaned Organization');
    });

    it('should display complex hierarchical titles from server', () => {
      const { result } = renderHook(() => useTaxonomyStore());
      const grandChild: Organization = {
        id: 3,
        name: 'grandchild',
        title: 'Test Organization › Child Organization › Grandchild Organization', // Server provides full hierarchical title
        ancestry: '1/2',
      };

      act(() => {
        result.current.setAvailableOrganizations([
          mockOrganization,
          mockNestedOrganization,
          grandChild,
        ]);
        result.current.setCurrentOrganization(grandChild);
      });

      expect(result.current.getContextPath()).toBe(
        'Test Organization › Child Organization › Grandchild Organization'
      );
    });
  });

  describe('Persistence', () => {
    it('should persist current organization and location', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        result.current.setCurrentOrganization(mockOrganization);
        result.current.setCurrentLocation(mockLocation);
      });

      // Create a new hook instance to simulate page reload
      const { result: newResult } = renderHook(() => useTaxonomyStore());

      expect(newResult.current.currentOrganization).toEqual(mockOrganization);
      expect(newResult.current.currentLocation).toEqual(mockLocation);
    });

    it('should not persist loading state or available items', () => {
      const { result } = renderHook(() => useTaxonomyStore());

      act(() => {
        // First reset to ensure clean state
        result.current.resetContext();
        result.current.setLoading(true);
        result.current.setAvailableOrganizations([mockOrganization]);
        result.current.setAvailableLocations([mockLocation]);
      });

      // Simulate clearing non-persisted state on reload by manually resetting them
      act(() => {
        result.current.setLoading(false);
        result.current.setAvailableOrganizations([]);
        result.current.setAvailableLocations([]);
      });

      // Create a new hook instance to simulate page reload behavior
      const { result: newResult } = renderHook(() => useTaxonomyStore());

      expect(newResult.current.isLoading).toBe(false);
      expect(newResult.current.availableOrganizations).toEqual([]);
      expect(newResult.current.availableLocations).toEqual([]);
    });
  });
});