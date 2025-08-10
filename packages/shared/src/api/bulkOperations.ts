import { BulkOperationResult } from '../types';
import { ForemanAPIClient } from './client';

export interface BulkOperationConfig {
  id: string;
  label: string;
  endpoint: string;
  method: 'PUT' | 'POST' | 'DELETE';
  requiresConfirmation?: boolean;
  destructive?: boolean;
  parameters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'text' | 'number';
    required?: boolean;
    options?: Array<{ value: string | number; label: string }>;
    placeholder?: string;
  }>;
}

export class BulkOperationsAPI {
  constructor(private client: ForemanAPIClient) {}

  /**
   * Helper function to check if a parameter is null or undefined
   */
  private isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }

  // Core bulk operations
  async updateHostgroup(hostIds: number[], hostgroupId: number): Promise<BulkOperationResult> {
    return this.client.bulkUpdateHostgroup(hostIds, hostgroupId);
  }

  async updateEnvironment(hostIds: number[], environmentId: number): Promise<BulkOperationResult> {
    return this.client.bulkUpdateEnvironment(hostIds, environmentId);
  }

  async updateOwner(hostIds: number[], ownerId: number, ownerType: string = 'User'): Promise<BulkOperationResult> {
    return this.client.bulkUpdateOwner(hostIds, ownerId, ownerType);
  }

  async updateOrganization(hostIds: number[], organizationId: number): Promise<BulkOperationResult> {
    return this.client.bulkUpdateOrganization(hostIds, organizationId);
  }

  async updateLocation(hostIds: number[], locationId: number): Promise<BulkOperationResult> {
    return this.client.bulkUpdateLocation(hostIds, locationId);
  }

  async updateParameters(hostIds: number[], parameters: Record<string, unknown>): Promise<BulkOperationResult> {
    return this.client.bulkUpdateParameters(hostIds, parameters);
  }

  async changeGroup(hostIds: number[], groupName: string): Promise<BulkOperationResult> {
    return this.client.bulkChangeGroup(hostIds, groupName);
  }

  async build(hostIds: number[]): Promise<BulkOperationResult> {
    return this.client.bulkBuild(hostIds);
  }

  async destroy(hostIds: number[]): Promise<BulkOperationResult> {
    return this.client.bulkDestroy(hostIds);
  }

  async disown(hostIds: number[]): Promise<BulkOperationResult> {
    return this.client.bulkDisown(hostIds);
  }

  async enable(hostIds: number[]): Promise<BulkOperationResult> {
    return this.client.bulkEnable(hostIds);
  }

  async disable(hostIds: number[]): Promise<BulkOperationResult> {
    return this.client.bulkDisable(hostIds);
  }

  // Generic bulk operation executor
  async executeBulkOperation(
    operationId: string,
    hostIds: number[],
    parameters?: Record<string, unknown>
  ): Promise<BulkOperationResult> {
    switch (operationId) {
      case 'update_hostgroup':
        if (this.isNullOrUndefined(parameters?.hostgroup_id)) {
          throw new Error('Hostgroup ID is required');
        }
        return this.updateHostgroup(hostIds, Number(parameters!.hostgroup_id));

      case 'update_environment':
        if (this.isNullOrUndefined(parameters?.environment_id)) {
          throw new Error('Environment ID is required');
        }
        return this.updateEnvironment(hostIds, Number(parameters!.environment_id));

      case 'update_owner':
        if (this.isNullOrUndefined(parameters?.owner_id)) {
          throw new Error('Owner ID is required');
        }
        return this.updateOwner(
          hostIds,
          Number(parameters!.owner_id),
this.isNullOrUndefined(parameters?.owner_type) ? 'User' : String(parameters!.owner_type)
        );

      case 'update_organization':
        if (this.isNullOrUndefined(parameters?.organization_id)) {
          throw new Error('Organization ID is required');
        }
        return this.updateOrganization(hostIds, Number(parameters!.organization_id));

      case 'update_location':
        if (this.isNullOrUndefined(parameters?.location_id)) {
          throw new Error('Location ID is required');
        }
        return this.updateLocation(hostIds, Number(parameters!.location_id));

      case 'update_parameters':
        if (this.isNullOrUndefined(parameters?.host_parameters)) {
          throw new Error('Parameters are required');
        }
        return this.updateParameters(hostIds, parameters!.host_parameters as Record<string, unknown>);

      case 'change_group':
        if (this.isNullOrUndefined(parameters?.group)) {
          throw new Error('Group name is required');
        }
        return this.changeGroup(hostIds, String(parameters!.group));

      case 'build':
        return this.build(hostIds);

      case 'destroy':
        return this.destroy(hostIds);

      case 'disown':
        return this.disown(hostIds);

      case 'enable':
        return this.enable(hostIds);

      case 'disable':
        return this.disable(hostIds);

      default:
        throw new Error(`Unknown bulk operation: ${operationId}`);
    }
  }

  // Get available bulk operations configuration
  getBulkOperationsConfig(): BulkOperationConfig[] {
    return [
      {
        id: 'update_hostgroup',
        label: 'Change Host Group',
        endpoint: '/hosts/update_multiple_hostgroup',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'hostgroup_id',
            label: 'Host Group',
            type: 'select',
            required: true,
            placeholder: 'Select a host group',
          },
        ],
      },
      {
        id: 'update_environment',
        label: 'Change Environment',
        endpoint: '/hosts/update_multiple_environment',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'environment_id',
            label: 'Environment',
            type: 'select',
            required: true,
            placeholder: 'Select an environment',
          },
        ],
      },
      {
        id: 'update_owner',
        label: 'Change Owner',
        endpoint: '/hosts/update_multiple_owner',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'owner_id',
            label: 'Owner',
            type: 'select',
            required: true,
            placeholder: 'Select an owner',
          },
          {
            key: 'owner_type',
            label: 'Owner Type',
            type: 'select',
            required: true,
            options: [
              { value: 'User', label: 'User' },
              { value: 'Usergroup', label: 'User Group' },
            ],
          },
        ],
      },
      {
        id: 'update_organization',
        label: 'Change Organization',
        endpoint: '/hosts/update_multiple_organization',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'organization_id',
            label: 'Organization',
            type: 'select',
            required: true,
            placeholder: 'Select an organization',
          },
        ],
      },
      {
        id: 'update_location',
        label: 'Change Location',
        endpoint: '/hosts/update_multiple_location',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'location_id',
            label: 'Location',
            type: 'select',
            required: true,
            placeholder: 'Select a location',
          },
        ],
      },
      {
        id: 'change_group',
        label: 'Change Group',
        endpoint: '/hosts/multiple_change_group',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'group',
            label: 'Group Name',
            type: 'text',
            required: true,
            placeholder: 'Enter group name',
          },
        ],
      },
      {
        id: 'build',
        label: 'Rebuild Hosts',
        endpoint: '/hosts/multiple_build',
        method: 'PUT',
        requiresConfirmation: true,
        destructive: false,
      },
      {
        id: 'enable',
        label: 'Enable Hosts',
        endpoint: '/hosts/multiple_enable',
        method: 'PUT',
        requiresConfirmation: false,
      },
      {
        id: 'disable',
        label: 'Disable Hosts',
        endpoint: '/hosts/multiple_disable',
        method: 'PUT',
        requiresConfirmation: true,
        destructive: false,
      },
      {
        id: 'disown',
        label: 'Remove Ownership',
        endpoint: '/hosts/multiple_disown',
        method: 'PUT',
        requiresConfirmation: true,
        destructive: false,
      },
      {
        id: 'destroy',
        label: 'Delete Hosts',
        endpoint: '/hosts/multiple_destroy',
        method: 'PUT',
        requiresConfirmation: true,
        destructive: true,
      },
    ];
  }
}