import { useMemo } from 'react';
import { createDefaultClient } from '../api/client';
import { HostsAPI } from '../api/hosts';
import { UsersAPI } from '../api/users';
import { AuthAPI } from '../api/auth';
import { RegistrationAPI } from '../api/registration';
import { RegistrationFormAPI } from '../api/registrationForm';
import { HostGroupsAPI } from '../api/hostgroups';
import { SmartProxiesAPI } from '../api/smartproxies';
import { TaxonomyAPI } from '../api/taxonomy';

export const useApi = () => {
  return useMemo(() => {
    const client = createDefaultClient();

    return {
      client,
      hosts: new HostsAPI(client),
      users: new UsersAPI(client),
      auth: new AuthAPI(client),
      registration: new RegistrationAPI(client),
      registrationForm: new RegistrationFormAPI(client),
      hostgroups: new HostGroupsAPI(client),
      smartproxies: new SmartProxiesAPI(client),
      taxonomyApi: new TaxonomyAPI(client),
    };
  }, []);
};