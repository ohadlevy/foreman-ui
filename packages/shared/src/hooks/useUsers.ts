import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useApi } from './useApi';
import { UserFormData, SearchParams } from '../types';
import { useAuthStore } from '../auth/store';
import { useAuth } from '../auth/useAuth';

export const useUsers = (params?: SearchParams) => {
  const { users } = useApi();
  const { hasPermission } = useAuth();

  const canViewUsers = useMemo(() => hasPermission('view_users'), [hasPermission]);

  return useQuery({
    queryKey: ['users', params],
    queryFn: () => users.list(params),
    keepPreviousData: true,
    enabled: canViewUsers,
  });
};

export const useUser = (id: number, enabled = true) => {
  const { users } = useApi();
  const { hasPermission } = useAuth();

  const canViewUsers = useMemo(() => hasPermission('view_users'), [hasPermission]);

  return useQuery({
    queryKey: ['users', id],
    queryFn: () => users.get(id),
    enabled: enabled && !!id && canViewUsers,
  });
};

export const useCurrentUser = () => {
  const { users } = useApi();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => users.getCurrent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateUser = () => {
  const { users } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFormData) => users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const { users } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
      users.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useUpdateCurrentUser = () => {
  const { users } = useApi();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<UserFormData>) => users.updateCurrent(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['verifyToken'] });
      // Update the cache with the new user data immediately
      queryClient.setQueryData(['currentUser'], updatedUser);
      // Also update the auth store
      setUser(updatedUser);
    },
  });
};

export const useDeleteUser = () => {
  const { users } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useChangePassword = () => {
  const { users } = useApi();

  return useMutation({
    mutationFn: ({
      id,
      currentPassword,
      newPassword
    }: {
      id: number;
      currentPassword: string;
      newPassword: string;
    }) => users.changePassword(id, currentPassword, newPassword),
  });
};