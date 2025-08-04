import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { SmartProxyFormData, SearchParams } from '../types';

export const useSmartProxies = (params?: SearchParams) => {
  const { smartProxies } = useApi();

  return useQuery({
    queryKey: ['smartProxies', params],
    queryFn: () => smartProxies.list(params),
    keepPreviousData: true,
  });
};

export const useSmartProxy = (id: number, enabled = true) => {
  const { smartProxies } = useApi();

  return useQuery({
    queryKey: ['smartProxies', id],
    queryFn: () => smartProxies.get(id),
    enabled: enabled && !!id,
  });
};

export const useSmartProxyStatus = (id: number, enabled = true) => {
  const { smartProxies } = useApi();

  return useQuery({
    queryKey: ['smartProxies', id, 'status'],
    queryFn: () => smartProxies.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: 30000, // Refresh status every 30 seconds
  });
};

export const useSmartProxyFeatures = (id: number, enabled = true) => {
  const { smartProxies } = useApi();

  return useQuery({
    queryKey: ['smartProxies', id, 'features'],
    queryFn: () => smartProxies.getFeatures(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // Features don't change often
  });
};

export const useCreateSmartProxy = () => {
  const { smartProxies } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SmartProxyFormData) => smartProxies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smartProxies'] });
    },
  });
};

export const useUpdateSmartProxy = () => {
  const { smartProxies } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SmartProxyFormData> }) =>
      smartProxies.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['smartProxies'] });
      queryClient.invalidateQueries({ queryKey: ['smartProxies', id] });
    },
  });
};

export const useDeleteSmartProxy = () => {
  const { smartProxies } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => smartProxies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smartProxies'] });
    },
  });
};

export const useRefreshSmartProxy = () => {
  const { smartProxies } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => smartProxies.refresh(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['smartProxies', id] });
      queryClient.invalidateQueries({ queryKey: ['smartProxies', id, 'status'] });
      queryClient.invalidateQueries({ queryKey: ['smartProxies', id, 'features'] });
    },
  });
};

export const useImportPuppetClasses = () => {
  const { smartProxies } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => smartProxies.importPuppetClasses(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['smartProxies', id] });
    },
  });
};

export const useTestSmartProxyConnection = () => {
  const { smartProxies } = useApi();

  return useMutation({
    mutationFn: (url: string) => smartProxies.testConnection(url),
  });
};