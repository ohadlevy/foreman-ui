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


  async updateOwner(hostIds: number[], ownerId: number, ownerType: string = 'User'): Promise<BulkOperationResult> {
    return this.client.bulkUpdateOwner(hostIds, ownerId, ownerType);
  }

  async updateOrganization(hostIds: number[], organizationId: number): Promise<BulkOperationResult> {
    return this.client.bulkUpdateOrganization(hostIds, organizationId);
  }

  async updateLocation(hostIds: number[], locationId: number): Promise<BulkOperationResult> {
    return this.client.bulkUpdateLocation(hostIds, locationId);
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


      case 'update_owner': {
        if (this.isNullOrUndefined(parameters?.owner_id)) {
          throw new Error('Owner ID is required');
        }
        const ownerType = this.isNullOrUndefined(parameters?.owner_type) ? 'User' : String(parameters!.owner_type);
        return this.updateOwner(
          hostIds,
          Number(parameters!.owner_id),
          ownerType
        );
      }

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



      case 'build':
        return this.build(hostIds);

      case 'destroy':
        return this.destroy(hostIds);

      case 'disown':
        return this.disown(hostIds);


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
        endpoint: '/hosts/bulk/reassign_hostgroup',
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
        id: 'update_owner',
        label: 'Change Owner',
        endpoint: '/hosts/bulk/change_owner',
        method: 'PUT',
        requiresConfirmation: true,
        parameters: [
          {
            key: 'owner_id',
            label: 'Owner (User)',
            type: 'select',
            required: true,
            placeholder: 'Select a user',
          },
        ],
      },
      {
        id: 'update_organization',
        label: 'Change Organization',
        endpoint: '/hosts/bulk/assign_organization',
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
        endpoint: '/hosts/bulk/assign_location',
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
        id: 'build',
        label: 'Rebuild Hosts',
        endpoint: '/hosts/bulk/build',
        method: 'PUT',
        requiresConfirmation: true,
        destructive: false,
      },
      {
        id: 'disown',
        label: 'Remove Ownership',
        endpoint: '/hosts/bulk/disassociate',
        method: 'PUT',
        requiresConfirmation: true,
        destructive: false,
      },
      {
        id: 'destroy',
        label: 'Delete Hosts',
        endpoint: '/hosts/bulk',
        method: 'DELETE',
        requiresConfirmation: true,
        destructive: true,
      },
    ];
  }
}