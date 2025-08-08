import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';
import { RegistrationParams } from '../types';

export const useRegistrationCommand = (params: RegistrationParams, enabled = true) => {
  const { registration } = useApi();
  const { hasPermission } = useAuth();

  return useQuery(
    ['registration', 'command', params, enabled],
    () => registration.generateCommand(params),
    {
      enabled: enabled && hasPermission('create_hosts'),
      // Don't cache registration tokens for security
      cacheTime: 0,
      staleTime: 0,
    }
  );
};

export const useGenerateRegistrationCommand = () => {
  const { registration } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RegistrationParams) => registration.generateCommand(params),
    onSuccess: (data) => {
      // Cache the generated command temporarily
      queryClient.setQueryData(['registration', 'command', data.parameters], data);
    },
  });
};

