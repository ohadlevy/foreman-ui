import React, { createContext, useContext, useMemo } from 'react';
import { BulkAction, HostGroup } from '../../types';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useHostGroups } from '../../hooks/useHostGroups';
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
    'update_environment', 
    'update_owner',
    'update_organization',
    'update_location',
    'build',
    'destroy',
    'enable',
    'disable',
    'disown'
  ],
  userPermissions = [],
}) => {
  const { executeBulkOperation } = useBulkOperations();
  const { data: hostGroupsResponse, isLoading: hostGroupsLoading } = useHostGroups();
  const hostGroups = hostGroupsResponse?.results || [];

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
        action: async (selectedItemIds: number[], parameters?: Record<string, unknown>) => {
          validateParameter(parameters, 'hostgroup_id', 'number', { min: 1 });
          return executeBulkOperation('update_hostgroup', selectedItemIds, parameters);
        },
        parameters: getHostgroupParameters(),
      },

      // Change Environment
      {
        id: 'update_environment',
        label: 'Change Environment',
        requiresConfirmation: true,
        confirmationTitle: 'Change Environment',
        confirmationMessage: 'Specify the new environment for the selected hosts.',
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[], parameters?: Record<string, unknown>) => {
          validateParameter(parameters, 'environment_id', 'number', { min: 1 });
          return executeBulkOperation('update_environment', selectedItemIds, parameters);
        },
        parameters: [
          {
            key: 'environment_id',
            label: 'Environment ID',
            type: 'number' as const,
            required: true,
            placeholder: 'Enter environment ID...',
          },
        ],
      },

      // Change Owner
      {
        id: 'update_owner',
        label: 'Change Owner',
        requiresConfirmation: true,
        confirmationTitle: 'Change Owner',
        confirmationMessage: 'Assign a new owner to the selected hosts.',
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[], parameters?: Record<string, unknown>) => {
          validateParameter(parameters, 'owner_id', 'number', { min: 1 });
          return executeBulkOperation('update_owner', selectedItemIds, parameters);
        },
        parameters: [
          {
            key: 'owner_id',
            label: 'Owner ID',
            type: 'number' as const,
            required: true,
            placeholder: 'Enter owner ID...',
          },
          {
            key: 'owner_type',
            label: 'Owner Type',
            type: 'select' as const,
            required: false,
            options: [
              { value: 'User', label: 'User' },
              { value: 'Usergroup', label: 'User Group' },
            ],
            placeholder: 'Select owner type...',
          },
        ],
      },

      // Change Organization
      {
        id: 'update_organization',
        label: 'Change Organization',
        requiresConfirmation: true,
        confirmationTitle: 'Change Organization',
        confirmationMessage: 'Move the selected hosts to a different organization.',
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[], parameters?: Record<string, unknown>) => {
          validateParameter(parameters, 'organization_id', 'number', { min: 1 });
          return executeBulkOperation('update_organization', selectedItemIds, parameters);
        },
        parameters: [
          {
            key: 'organization_id',
            label: 'Organization ID',
            type: 'number' as const,
            required: true,
            placeholder: 'Enter organization ID...',
          },
        ],
      },

      // Change Location
      {
        id: 'update_location',
        label: 'Change Location',
        requiresConfirmation: true,
        confirmationTitle: 'Change Location',
        confirmationMessage: 'Move the selected hosts to a different location.',
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[], parameters?: Record<string, unknown>) => {
          validateParameter(parameters, 'location_id', 'number', { min: 1 });
          return executeBulkOperation('update_location', selectedItemIds, parameters);
        },
        parameters: [
          {
            key: 'location_id',
            label: 'Location ID',
            type: 'number' as const,
            required: true,
            placeholder: 'Enter location ID...',
          },
        ],
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

      // Enable Hosts
      {
        id: 'enable',
        label: 'Enable Hosts',
        requiresConfirmation: true,
        confirmationTitle: 'Enable Hosts',
        confirmationMessage: 'This will enable the selected hosts.',
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[]) => {
          return executeBulkOperation('enable', selectedItemIds);
        },
      },

      // Disable Hosts
      {
        id: 'disable',
        label: 'Disable Hosts',
        requiresConfirmation: true,
        confirmationTitle: 'Disable Hosts',
        confirmationMessage: 'This will disable the selected hosts.',
        destructive: true,
        permissions: ['edit_hosts'],
        action: async (selectedItemIds: number[]) => {
          return executeBulkOperation('disable', selectedItemIds);
        },
      },

      // Disown Hosts
      {
        id: 'disown',
        label: 'Remove Owner',
        requiresConfirmation: true,
        confirmationTitle: 'Remove Owner',
        confirmationMessage: 'This will remove the owner from the selected hosts.',
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
  ]);

  const contextValue = useMemo(() => ({
    actions,
    isLoading: hostGroupsLoading,
  }), [actions, hostGroupsLoading]);

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