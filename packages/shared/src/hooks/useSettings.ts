import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { SettingsSearchParams, SettingFormData } from '../api/settings';

export const useSettings = (params?: SettingsSearchParams) => {
  const { settings } = useApi();

  return useQuery({
    queryKey: ['settings', params],
    queryFn: () => settings.list(params),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // Settings don't change frequently
  });
};

export const useSetting = (id: number, enabled = true) => {
  const { settings } = useApi();

  return useQuery({
    queryKey: ['settings', id],
    queryFn: () => settings.get(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSettingByName = (name: string, enabled = true) => {
  const { settings } = useApi();

  return useQuery({
    queryKey: ['settings', 'name', name],
    queryFn: () => settings.getByName(name),
    enabled: enabled && !!name,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSettingsCategories = () => {
  const { settings } = useApi();

  return useQuery({
    queryKey: ['settings', 'categories'],
    queryFn: () => settings.getCategories(),
    staleTime: 5 * 60 * 1000, // Categories rarely change
  });
};

export const useUpdateSetting = () => {
  const { settings } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SettingFormData }) =>
      settings.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', id] });
    },
  });
};

export const useUpdateSettingByName = () => {
  const { settings } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: SettingFormData }) =>
      settings.updateByName(name, data),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'name', name] });
    },
  });
};

export const useResetSettingToDefault = () => {
  const { settings } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => settings.resetToDefault(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', id] });
    },
  });
};