import { useAuth } from '../auth/useAuth';

export const usePermissions = () => {
  const { hasPermission, isAdmin, user } = useAuth();

  // If we don't have user data yet, we can't determine permissions
  const hasUserData = !!user;

  // Common permission checks for Foreman resources
  const permissions = {
    // Host permissions
    canCreateHosts: () => hasPermission('create_hosts') || hasPermission('create', 'Host') || isAdmin(),
    canViewHosts: () => hasPermission('view_hosts') || hasPermission('view', 'Host') || isAdmin(),
    canEditHosts: () => hasPermission('edit_hosts') || hasPermission('edit', 'Host') || isAdmin(),
    canDeleteHosts: () => hasPermission('destroy_hosts') || hasPermission('destroy', 'Host') || isAdmin(),
    canBuildHosts: () => hasPermission('build_hosts') || hasPermission('build', 'Host') || isAdmin(),
    canPowerHosts: () => hasPermission('power_hosts') || hasPermission('power', 'Host') || isAdmin(),
    canConsoleHosts: () => hasPermission('console_hosts') || hasPermission('console', 'Host') || isAdmin(),

    // User permissions
    canViewUsers: () => hasPermission('view_users') || hasPermission('view', 'User') || isAdmin(),
    canEditUsers: () => hasPermission('edit_users') || hasPermission('edit', 'User') || isAdmin(),
    canCreateUsers: () => hasPermission('create_users') || hasPermission('create', 'User') || isAdmin(),

    // Organization/Location permissions
    canViewOrganizations: () => hasPermission('view_organizations') || hasPermission('view', 'Organization') || isAdmin(),
    canViewLocations: () => hasPermission('view_locations') || hasPermission('view', 'Location') || isAdmin(),

    // Generic permission checker
    can: (permission: string, resource?: string) => hasPermission(permission, resource) || isAdmin(),
  };

  return {
    ...permissions,
    hasUserData,
  };
};