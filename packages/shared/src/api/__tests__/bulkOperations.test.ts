import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkOperationsAPI } from '../bulkOperations';
import { ForemanAPIClient } from '../client';
import { BulkOperationResult } from '../../types';

// Mock the ForemanAPIClient
const mockClient = {
  bulkUpdateHostgroup: vi.fn(),
  bulkUpdateOwner: vi.fn(),
  bulkUpdateOrganization: vi.fn(),
  bulkUpdateLocation: vi.fn(),
  bulkBuild: vi.fn(),
  bulkDestroy: vi.fn(),
  bulkDisown: vi.fn(),
} as unknown as ForemanAPIClient;

describe('BulkOperationsAPI', () => {
  let bulkAPI: BulkOperationsAPI;
  
  const mockResult: BulkOperationResult = {
    success_count: 2,
    failed_count: 1,
    errors: [
      {
        item_id: 3,
        item_name: 'host3.example.com',
        message: 'Permission denied',
      },
    ],
    warnings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    bulkAPI = new BulkOperationsAPI(mockClient);
  });

  describe('updateHostgroup', () => {
    it('should call client bulkUpdateHostgroup with correct parameters', async () => {
      const hostIds = [1, 2, 3];
      const hostgroupId = 5;
      
      (mockClient.bulkUpdateHostgroup as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.updateHostgroup(hostIds, hostgroupId);
      
      expect(mockClient.bulkUpdateHostgroup).toHaveBeenCalledWith(hostIds, hostgroupId);
      expect(result).toEqual(mockResult);
    });
  });


  describe('updateOwner', () => {
    it('should call client bulkUpdateOwner with correct parameters', async () => {
      const hostIds = [1, 2];
      const ownerId = 5;
      const ownerType = 'User';
      
      (mockClient.bulkUpdateOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.updateOwner(hostIds, ownerId, ownerType);
      
      expect(mockClient.bulkUpdateOwner).toHaveBeenCalledWith(hostIds, ownerId, ownerType);
      expect(result).toEqual(mockResult);
    });

    it('should default to User owner type', async () => {
      const hostIds = [1, 2];
      const ownerId = 5;
      
      (mockClient.bulkUpdateOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      await bulkAPI.updateOwner(hostIds, ownerId);
      
      expect(mockClient.bulkUpdateOwner).toHaveBeenCalledWith(hostIds, ownerId, 'User');
    });
  });

  describe('executeBulkOperation', () => {
    it('should execute update_hostgroup operation', async () => {
      const hostIds = [1, 2];
      const parameters = { hostgroup_id: 5 };
      
      (mockClient.bulkUpdateHostgroup as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.executeBulkOperation('update_hostgroup', hostIds, parameters);
      
      expect(mockClient.bulkUpdateHostgroup).toHaveBeenCalledWith(hostIds, 5);
      expect(result).toEqual(mockResult);
    });


    it('should execute build operation without parameters', async () => {
      const hostIds = [1, 2];
      
      (mockClient.bulkBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.executeBulkOperation('build', hostIds);
      
      expect(mockClient.bulkBuild).toHaveBeenCalledWith(hostIds);
      expect(result).toEqual(mockResult);
    });

    it('should throw error for unknown operation', async () => {
      const hostIds = [1, 2];
      
      await expect(
        bulkAPI.executeBulkOperation('unknown_operation', hostIds)
      ).rejects.toThrow('Unknown bulk operation: unknown_operation');
    });

    it('should throw error for missing required parameters', async () => {
      const hostIds = [1, 2];
      
      await expect(
        bulkAPI.executeBulkOperation('update_hostgroup', hostIds, {})
      ).rejects.toThrow('Hostgroup ID is required');
    });

    it('should allow zero as a valid ID parameter', async () => {
      const hostIds = [1, 2];
      const parameters = { hostgroup_id: 0 };
      
      (mockClient.bulkUpdateHostgroup as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.executeBulkOperation('update_hostgroup', hostIds, parameters);
      
      expect(mockClient.bulkUpdateHostgroup).toHaveBeenCalledWith(hostIds, 0);
      expect(result).toEqual(mockResult);
    });

    it('should handle update_owner with custom owner type', async () => {
      const hostIds = [1, 2];
      const parameters = { owner_id: 5, owner_type: 'Usergroup' };
      
      (mockClient.bulkUpdateOwner as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      await bulkAPI.executeBulkOperation('update_owner', hostIds, parameters);
      
      expect(mockClient.bulkUpdateOwner).toHaveBeenCalledWith(hostIds, 5, 'Usergroup');
    });
  });

  describe('getBulkOperationsConfig', () => {
    it('should return array of operation configurations', () => {
      const config = bulkAPI.getBulkOperationsConfig();
      
      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
      
      // Check that essential operations are present
      const operationIds = config.map(op => op.id);
      expect(operationIds).toContain('update_hostgroup');
      expect(operationIds).toContain('update_owner');
      expect(operationIds).toContain('update_organization');
      expect(operationIds).toContain('update_location');
      expect(operationIds).toContain('build');
      expect(operationIds).toContain('destroy');
      expect(operationIds).toContain('disown');
    });

    it('should include required metadata for each operation', () => {
      const config = bulkAPI.getBulkOperationsConfig();
      
      config.forEach(operation => {
        expect(operation).toHaveProperty('id');
        expect(operation).toHaveProperty('label');
        expect(operation).toHaveProperty('endpoint');
        expect(operation).toHaveProperty('method');
        expect(typeof operation.id).toBe('string');
        expect(typeof operation.label).toBe('string');
        expect(typeof operation.endpoint).toBe('string');
        expect(['PUT', 'POST', 'DELETE']).toContain(operation.method);
      });
    });

    it('should mark destructive operations correctly', () => {
      const config = bulkAPI.getBulkOperationsConfig();
      const destroyOperation = config.find(op => op.id === 'destroy');
      
      expect(destroyOperation?.destructive).toBe(true);
    });

    it('should include parameter definitions for operations that need them', () => {
      const config = bulkAPI.getBulkOperationsConfig();
      const hostgroupOperation = config.find(op => op.id === 'update_hostgroup');
      
      expect(hostgroupOperation?.parameters).toBeDefined();
      expect(Array.isArray(hostgroupOperation?.parameters)).toBe(true);
      expect(hostgroupOperation?.parameters?.[0]).toHaveProperty('key', 'hostgroup_id');
      expect(hostgroupOperation?.parameters?.[0]).toHaveProperty('required', true);
    });
  });

  describe('destructive operations', () => {
    it('should execute destroy operation', async () => {
      const hostIds = [1, 2];
      
      (mockClient.bulkDestroy as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.destroy(hostIds);
      
      expect(mockClient.bulkDestroy).toHaveBeenCalledWith(hostIds);
      expect(result).toEqual(mockResult);
    });
  });


});