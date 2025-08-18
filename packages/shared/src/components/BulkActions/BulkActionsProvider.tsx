import React, { createContext, useContext, useMemo } from 'react';
import { BulkAction } from '../../types';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useBulkOperationTargets } from '../../hooks/useHostsGraphQL';
import { validateParameter } from '../../utils/bulkOperationUtils';

interface BulkOperationTargets {
  hostgroups?: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        title?: string;
      };
    }>;
  };
  users?: {
    edges: Array<{
      node: {
        id: string;
        login: string;
        firstname?: string;
        lastname?: string;
        name?: string;
      };
    }>;
  };
  organizations?: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        title?: string;
      };
    }>;
  };
  locations?: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        title?: string;
      };
    }>;
  };
}

interface BulkActionsContextType {
  actions: BulkAction[];
  isLoading: boolean;
}

const BulkActionsContext = createContext<BulkActionsContextType | undefined>(undefined);

interface BulkActionsProviderProps {
  children: React.ReactNode;
  enabledActions?: string[];
  userPermissions?: string[];
  hasSelectedItems?: boolean;
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
  hasSelectedItems = false,
}) => {
  const { executeBulkOperation } = useBulkOperations();
  
  // Only load bulk operation targets when there are selected items AND when any target-requiring action is enabled
  const targetRequiringActions = ['update_hostgroup', 'update_owner', 'update_organization', 'update_location'];
  const shouldLoadTargets = hasSelectedItems && enabledActions.some(a => targetRequiringActions.includes(a));
  const { data: bulkTargets, isLoading: bulkTargetsLoading } = useBulkOperationTargets(shouldLoadTargets);
  
  // Extract data from the single GraphQL query with proper typing
  const typedBulkTargets = bulkTargets as BulkOperationTargets | undefined;
  const hostGroups = typedBulkTargets?.hostgroups?.edges?.map((edge) => edge.node) || [];
  const users = typedBulkTargets?.users?.edges?.map((edge) => edge.node) || [];
  const organizations = typedBulkTargets?.organizations?.edges?.map((edge) => edge.node) || [];
  const locations = typedBulkTargets?.locations?.edges?.map((edge) => edge.node) || [];

  // Helper function to generate hostgroup parameters for improved readability
  const getHostgroupParameters = () => [
    {
      key: 'hostgroup_id',
      label: 'Hostgroup',
      type: 'select' as const,
      required: true,
      options: hostGroups.map((hg) => ({
        value: parseInt(hg.id, 10),
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
      options: users.map((user) => ({
        value: parseInt(user.id, 10),
        label: user.name || [user.firstname, user.lastname].filter(Boolean).join(' ') || user.login,
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
      options: organizations.map((org) => ({
        value: parseInt(org.id, 10),
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
      options: locations.map((loc) => ({
        value: parseInt(loc.id, 10),
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
        disabled: bulkTargetsLoading || hostGroups.length === 0,
        disabledReason: bulkTargetsLoading ? 'Loading hostgroups...' : 'No hostgroups available',
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
        disabled: bulkTargetsLoading || users.length === 0,
        disabledReason: bulkTargetsLoading ? 'Loading users...' : 'No users available',
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
        disabled: bulkTargetsLoading || organizations.length === 0,
        disabledReason: bulkTargetsLoading ? 'Loading organizations...' : 'No organizations available',
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
        disabled: bulkTargetsLoading || locations.length === 0,
        disabledReason: bulkTargetsLoading ? 'Loading locations...' : 'No locations available',
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
        disabled: false,
        disabledReason: undefined,
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
        disabled: false,
        disabledReason: undefined,
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
        disabled: false,
        disabledReason: undefined,
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
    bulkTargetsLoading,
    users,
    organizations,
    locations,
  ]);

  const contextValue = useMemo(() => ({
    actions,
    isLoading: bulkTargetsLoading,
  }), [actions, bulkTargetsLoading]);

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