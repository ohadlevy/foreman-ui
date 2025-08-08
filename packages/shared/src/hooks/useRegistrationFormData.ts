import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../auth/useAuth';

export const useRegistrationFormData = () => {
  const { registrationForm } = useApi();
  const { hasPermission } = useAuth();

  return useQuery(
    ['registrationFormData'],
    () => registrationForm.getFormData(),
    {
      enabled: hasPermission('create_hosts'),
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes - this data doesn't change often
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};