import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { UserFormData, SearchParams } from '../types';
import { useAuthStore } from '../auth/store';
import { useAuth } from '../auth/useAuth';

export const useUsers = (params?: SearchParams) => {
  const { users } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['users', params],
    queryFn: () => users.list(params),
    keepPreviousData: true,
    // Note: Direct hasPermission call instead of useMemo - hasPermission function reference
    // changes on every render (from Zustand store), making memoization ineffective
    enabled: hasPermission('view_users'),
  });
};

export const useUser = (id: number, enabled = true) => {
  const { users } = useApi();
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ['users', id],
    queryFn: () => users.get(id),
    // Note: Direct hasPermission call instead of useMemo - hasPermission function reference
    // changes on every render (from Zustand store), making memoization ineffective
    enabled: enabled && !!id && hasPermission('view_users'),
  });
};

// useCurrentUser hook removed - use useAuth() directly instead for better performance

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
      // Removed: No longer needed since we use auth store directly
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
      // Removed: No longer needed since we use auth store directly
      queryClient.invalidateQueries({ queryKey: ['verifyToken'] });
      // Update the cache with the new user data immediately
      // Removed: No longer needed since we use auth store directly
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