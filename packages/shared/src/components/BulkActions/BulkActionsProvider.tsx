import React, { createContext, useContext, useMemo } from 'react';
import { BulkAction, HostGroup } from '../../types';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useHostGroups } from '../../hooks/useHostGroups';
import { useUsers } from '../../hooks/useUsers';
import { useOrganizations, useLocations } from '../../hooks/useTaxonomyQueries';
import { useApi } from '../../hooks/useApi';
import { validateParameter } from '../../utils/bulkOperationUtils';

interface BulkActionsContextType {
  actions: BulkAction[];
  isLoading: boolean;
}

const BulkActionsContext = createContext<BulkActionsContextType | undefined>(undefined);

interface BulkActionsProviderProps {
  children: React.ReactNode;
  enabledActions?: string[];
  userPermissions?: string[];
}

export const BulkActionsProvider: React.FC<BulkActionsProviderProps> = ({
  children,
  enabledActions = [
    'update_hostgroup',
    'update_owner',
    'update_organization',
    'update_location',
    'build',
    'destroy',
    'disown'
  ],
  userPermissions = [],
}) => {
  const { executeBulkOperation } = useBulkOperations();
  const { data: hostGroupsResponse, isLoading: hostGroupsLoading } = useHostGroups();
  const { data: usersResponse, isLoading: usersLoading } = useUsers();
  const { taxonomyApi } = useApi();
  
  // Fetch organizations using proper taxonomy hook
  const { data: organizationsResponse, isLoading: organizationsLoading } = useOrganizations(taxonomyApi);
  
  // Fetch locations using proper taxonomy hook
  const { data: locationsResponse, isLoading: locationsLoading } = useLocations(taxonomyApi);
  
  const hostGroups = hostGroupsResponse?.results || [];
  const users = usersResponse?.results || [];
  const organizations = organizationsResponse?.results || [];
  const locations = locationsResponse?.results || [];

  // Helper function to generate hostgroup parameters for improved readability
  const getHostgroupParameters = () => [
    {
      key: 'hostgroup_id',
      label: 'Hostgroup',
      type: 'select' as const,
      required: true,
      options: hostGroups.map((hg: HostGroup) => ({
        value: hg.id,
        label: hg.title || hg.name,
      })),
      placeholder: 'Select a hostgroup...',
    },
  ];

  // Helper function to generate owner parameters
  const getOwnerParameters = () => [
    {
      key: 'owner_id',
      label: 'Owner (User)',
      type: 'select' as const,
      required: true,
      options: users.map((user: { id: number; name?: string; login: string }) => ({
        value: user.id,
        label: user.name || user.login,
      })),
      placeholder: 'Select a user...',
    },
  ];

  // Helper function to generate organization parameters
  const getOrganizationParameters = () => [
    {
      key: 'organization_id',
      label: 'Organization',
      type: 'select' as const,
      required: true,
      options: organizations.map((org: { id: number; name: string; title?: string }) => ({
        value: org.id,
        label: org.title || org.name,
      })),
      placeholder: 'Select an organization...',
    },
  ];

  // Helper function to generate location parameters
  const getLocationParameters = () => [
    {
      key: 'location_id',
      label: 'Location',
      type: 'select' as const,
      required: true,
      options: locations.map((loc: { id: number; name: string; title?: string }) => ({
        value: loc.id,
        label: loc.title || loc.name,
      })),
      placeholder: 'Select a location...',
    },
  ];

  // Helper function for parameter validation and bulk operation execution
  const createValidatedAction = (
    paramName: string,
    paramType: 'string' | 'number' | 'boolean',
    operation: string,
    additionalParams?: Record<string, unknown>
  ) => async (selectedItemIds: number[], parameters?: Record<string, unknown>) => {
    validateParameter(parameters, paramName, paramType, { min: 1 });
    const finalParams = additionalParams ? { ...parameters, ...additionalParams } : parameters;
    return executeBulkOperation(operation, selectedItemIds, finalParams);
  };

  const actions: BulkAction[] = useMemo(() => {
    
    return [
      // Change Hostgroup
      {
        id: 'update_hostgroup',
        label: 'Change Hostgroup',
        requiresConfirmation: true,
        confirmationTitle: 'Change Hostgroup',
        confirmationMessage: 'Select a new hostgroup for the selected hosts.',
        disabled: hostGroupsLoading || hostGroups.length === 0,
        disabledReason: hostGroupsLoading ? 'Loading hostgroups...' : 'No hostgroups available',
        permissions: ['edit_hosts'],
        action: createValidatedAction('hostgroup_id', 'number', 'update_hostgroup'),
        parameters: getHostgroupParameters(),
      },


      // Change Owner
      {
        id: 'update_owner',
        label: 'Change Owner',
        requiresConfirmation: true,
        confirmationTitle: 'Change Owner',
        confirmationMessage: 'Assign a new owner to the selected hosts.',
        disabled: usersLoading || users.length === 0,
        disabledReason: usersLoading ? 'Loading users...' : 'No users available',
        permissions: ['edit_hosts'],
        action: createValidatedAction('owner_id', 'number', 'update_owner', { owner_type: 'User' }),
        parameters: getOwnerParameters(),
      },

      // Change Organization
      {
        id: 'update_organization',
        label: 'Change Organization',
        requiresConfirmation: true,
        confirmationTitle: 'Change Organization',
        confirmationMessage: 'Move the selected hosts to a different organization.',
        disabled: organizationsLoading || organizations.length === 0,
        disabledReason: organizationsLoading ? 'Loading organizations...' : 'No organizations available',
        permissions: ['edit_hosts'],
        action: createValidatedAction('organization_id', 'number', 'update_organization'),
        parameters: getOrganizationParameters(),
      },

      // Change Location
      {
        id: 'update_location',
        label: 'Change Location',
        requiresConfirmation: true,
        confirmationTitle: 'Change Location',
        confirmationMessage: 'Move the selected hosts to a different location.',
        disabled: locationsLoading || locations.length === 0,
        disabledReason: locationsLoading ? 'Loading locations...' : 'No locations available',
        permissions: ['edit_hosts'],
        action: createValidatedAction('location_id', 'number', 'update_location'),
        parameters: getLocationParameters(),
      },

      // Build Hosts
      {
        id: 'build',
        label: 'Rebuild Hosts',
        requiresConfirmation: true,
        confirmationTitle: 'Rebuild Hosts',
        confirmationMessage: 'This will mark the selected hosts for rebuild on next boot.',
        destructive: false,
        permissions: ['build_hosts'],
        action: async (selectedItemIds: number[]) => {
          return executeBulkOperation('build', selectedItemIds);
        },
      },


      // Disassociate Compute Resources (Disown)
      {
        id: 'disown',
        label: 'Disassociate Compute Resources',
        requiresConfirmation: true,
        confirmationTitle: 'Disassociate Compute Resources',
        confirmationMessage: 'This will disassociate compute resources from the selected hosts.',
        destructive: true,
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[]) => {
          return executeBulkOperation('disown', selectedItemIds);
        },
      },

      // Destroy Hosts
      {
        id: 'destroy',
        label: 'Delete Hosts',
        requiresConfirmation: true,
        confirmationTitle: 'Delete Hosts',
        confirmationMessage: 'This action cannot be undone. The selected hosts will be permanently deleted from Foreman.',
        destructive: true,
        permissions: ['destroy_hosts'],
        action: async (selectedItemIds: number[]) => {
          return executeBulkOperation('destroy', selectedItemIds);
        },
      },
    ]
      .filter(action => enabledActions.includes(action.id))
      .map(action => ({
        ...action,
        disabled: action.disabled || (
          action.permissions && 
          !action.permissions.every(permission => userPermissions.includes(permission))
        ),
        disabledReason: action.disabledReason || (
          action.permissions && 
          !action.permissions.every(permission => userPermissions.includes(permission))
            ? 'Insufficient permissions'
            : undefined
        ),
      }));
  }, [
    enabledActions,
    userPermissions,
    executeBulkOperation,
    hostGroups,
    hostGroupsLoading,
    users,
    usersLoading,
    organizations,
    organizationsLoading,
    locations,
    locationsLoading,
  ]);

  const contextValue = useMemo(() => ({
    actions,
    isLoading: hostGroupsLoading || usersLoading || organizationsLoading || locationsLoading,
  }), [actions, hostGroupsLoading, usersLoading, organizationsLoading, locationsLoading]);

  return (
    <BulkActionsContext.Provider value={contextValue}>
      {children}
    </BulkActionsContext.Provider>
  );
};

export const useBulkActions = (): BulkActionsContextType => {
  const context = useContext(BulkActionsContext);
  if (context === undefined) {
    throw new Error('useBulkActions must be used within a BulkActionsProvider');
  }
  return context;
};