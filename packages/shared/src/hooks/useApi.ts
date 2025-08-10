import { useMemo, useCallback } from 'react';
import { createDefaultClient, ForemanAPIClient } from '../api/client';
import { HostsAPI } from '../api/hosts';
import { UsersAPI } from '../api/users';
import { AuthAPI } from '../api/auth';
import { RegistrationAPI } from '../api/registration';
import { RegistrationFormAPI } from '../api/registrationForm';
import { HostGroupsAPI } from '../api/hostgroups';
import { SmartProxiesAPI } from '../api/smartproxies';
import { OrganizationsAPI } from '../api/organizations';
import { LocationsAPI } from '../api/locations';
import { createTaxonomyAwareClient } from '../api/taxonomyClient';
import { useTaxonomyStore } from '../stores/taxonomyStore';

export const useApi = () => {
  // Get current taxonomy context from store with shallow comparison for better performance
  const currentOrganization = useTaxonomyStore((state) => state.currentOrganization);
  const currentLocation = useTaxonomyStore((state) => state.currentLocation);

  // Memoize the taxonomy context getter to avoid recreating the client unnecessarily
  const getTaxonomyContext = useCallback(() => ({
    currentOrganization,
    currentLocation,
  }), [currentOrganization, currentLocation]);

  return useMemo(() => {
    const client = createDefaultClient();

    // Create taxonomy-aware client for resources that should be scoped
    const taxonomyClient = createTaxonomyAwareClient(client, getTaxonomyContext);

    return {
      client, // Original client for non-scoped operations
      taxonomyClient, // Taxonomy-aware client for scoped operations

      // APIs that should be taxonomy-aware (scoped to org/location)
      // The taxonomy client implements the same interface as ForemanAPIClient
      hosts: new HostsAPI(taxonomyClient as ForemanAPIClient),
      hostgroups: new HostGroupsAPI(taxonomyClient as ForemanAPIClient),
      smartproxies: new SmartProxiesAPI(taxonomyClient as ForemanAPIClient),

      // APIs that should NOT be taxonomy-aware (global)
      users: new UsersAPI(client),
      auth: new AuthAPI(client),
      registration: new RegistrationAPI(client),
      registrationForm: new RegistrationFormAPI(client),
      organizations: new OrganizationsAPI(client),
      locations: new LocationsAPI(client),
    };
  }, [getTaxonomyContext]);
};