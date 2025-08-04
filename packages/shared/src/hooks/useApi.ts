import { useMemo } from 'react';
import { createDefaultClient } from '../api/client';
import { HostsAPI } from '../api/hosts';
import { UsersAPI } from '../api/users';
import { AuthAPI } from '../api/auth';
import { SmartProxiesAPI } from '../api/smartProxies';
import { SettingsAPI } from '../api/settings';

export const useApi = () => {
  return useMemo(() => {
    const client = createDefaultClient();
    
    return {
      client,
      hosts: new HostsAPI(client),
      users: new UsersAPI(client),
      auth: new AuthAPI(client),
      smartProxies: new SmartProxiesAPI(client),
      settings: new SettingsAPI(client),
    };
  }, []);
};