import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkOperationsAPI } from '../bulkOperations';
import { ForemanAPIClient } from '../client';
import { BulkOperationResult } from '../../types';

// Mock the ForemanAPIClient
const mockClient = {
  bulkUpdateHostgroup: vi.fn(),
  bulkUpdateEnvironment: vi.fn(),
  bulkUpdateOwner: vi.fn(),
  bulkUpdateOrganization: vi.fn(),
  bulkUpdateLocation: vi.fn(),
  bulkUpdateParameters: vi.fn(),
  bulkChangeGroup: vi.fn(),
  bulkBuild: vi.fn(),
  bulkDestroy: vi.fn(),
  bulkDisown: vi.fn(),
  bulkEnable: vi.fn(),
  bulkDisable: vi.fn(),
} as unknown as ForemanAPIClient;

describe('BulkOperationsAPI', () => {
  let bulkAPI: BulkOperationsAPI;
  
  const mockResult: BulkOperationResult = {
    success_count: 2,
    failed_count: 1,
    errors: [
      {
        host_id: 3,
        host_name: 'host3.example.com',
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

  describe('updateEnvironment', () => {
    it('should call client bulkUpdateEnvironment with correct parameters', async () => {
      const hostIds = [1, 2];
      const environmentId = 3;
      
      (mockClient.bulkUpdateEnvironment as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.updateEnvironment(hostIds, environmentId);
      
      expect(mockClient.bulkUpdateEnvironment).toHaveBeenCalledWith(hostIds, environmentId);
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

    it('should execute update_environment operation', async () => {
      const hostIds = [1, 2];
      const parameters = { environment_id: 3 };
      
      (mockClient.bulkUpdateEnvironment as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.executeBulkOperation('update_environment', hostIds, parameters);
      
      expect(mockClient.bulkUpdateEnvironment).toHaveBeenCalledWith(hostIds, 3);
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
      expect(operationIds).toContain('update_environment');
      expect(operationIds).toContain('build');
      expect(operationIds).toContain('destroy');
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

  describe('enable/disable operations', () => {
    it('should execute enable operation', async () => {
      const hostIds = [1, 2];
      
      (mockClient.bulkEnable as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.enable(hostIds);
      
      expect(mockClient.bulkEnable).toHaveBeenCalledWith(hostIds);
      expect(result).toEqual(mockResult);
    });

    it('should execute disable operation', async () => {
      const hostIds = [1, 2];
      
      (mockClient.bulkDisable as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      const result = await bulkAPI.disable(hostIds);
      
      expect(mockClient.bulkDisable).toHaveBeenCalledWith(hostIds);
      expect(result).toEqual(mockResult);
    });
  });

  describe('parameter handling', () => {
    it('should handle complex parameters for updateParameters', async () => {
      const hostIds = [1, 2];
      const parameters = { 
        host_parameters: { 
          'key1': 'value1', 
          'key2': 42,
          'key3': { nested: 'object' }
        } 
      };
      
      (mockClient.bulkUpdateParameters as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);
      
      await bulkAPI.executeBulkOperation('update_parameters', hostIds, parameters);
      
      expect(mockClient.bulkUpdateParameters).toHaveBeenCalledWith(
        hostIds, 
        parameters.host_parameters
      );
    });
  });
});