import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization, Location } from '../types';

interface TaxonomyState {
  currentOrganization: Organization | null;
  currentLocation: Location | null;
  availableOrganizations: Organization[];
  availableLocations: Location[];
  isLoading: boolean;
  error: string | null;
}

interface TaxonomyActions {
  setCurrentOrganization: (organization: Organization | null) => void;
  setCurrentLocation: (location: Location | null) => void;
  setAvailableOrganizations: (organizations: Organization[]) => void;
  setAvailableLocations: (locations: Location[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetContext: () => void;
  updateContext: (organization: Organization | null, location: Location | null) => void;
  getContextPath: () => string;
  isContextSet: () => boolean;
}

export type TaxonomyStore = TaxonomyState & TaxonomyActions;

// Simple helper to get display name for taxonomy items
// Uses server-provided title field which already contains hierarchy formatting
const getDisplayName = (item: Organization | Location | null): string => {
  if (!item) return '';
  return item.title || item.name || 'Unknown';
};

export const useTaxonomyStore = create<TaxonomyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOrganization: null,
      currentLocation: null,
      availableOrganizations: [],
      availableLocations: [],
      isLoading: false,
      error: null,

      // Actions
      setCurrentOrganization: (organization: Organization | null) => {
        set({ currentOrganization: organization });
      },

      setCurrentLocation: (location: Location | null) => {
        set({ currentLocation: location });
      },

      setAvailableOrganizations: (organizations: Organization[]) => {
        set({ availableOrganizations: organizations });
      },

      setAvailableLocations: (locations: Location[]) => {
        set({ availableLocations: locations });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      resetContext: () => {
        set({
          currentOrganization: null,
          currentLocation: null,
          availableOrganizations: [],
          availableLocations: [],
          error: null,
        });
      },

      updateContext: (organization: Organization | null, location: Location | null) => {
        set({
          currentOrganization: organization,
          currentLocation: location,
          error: null,
        });
      },

      getContextPath: () => {
        const { currentOrganization, currentLocation } = get();

        const orgPath = getDisplayName(currentOrganization);
        const locPath = getDisplayName(currentLocation);

        if (orgPath && locPath) {
          return `${orgPath} • ${locPath}`;
        } else if (orgPath) {
          return orgPath;
        } else if (locPath) {
          return locPath;
        }

        return 'No context selected';
      },

      isContextSet: () => {
        const { currentOrganization, currentLocation } = get();
        return !!(currentOrganization || currentLocation);
      },
    }),
    {
      name: 'foreman-taxonomy',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        currentLocation: state.currentLocation,
        // Don't persist available items or loading state - they should be fetched fresh
      }),
    }
  )
);