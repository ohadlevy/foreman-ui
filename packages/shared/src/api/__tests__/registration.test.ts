import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrationAPI } from '../registration';
import { RegistrationParams } from '../../types';

// Mock the ForemanAPIClient
vi.mock('../client');

describe('RegistrationAPI', () => {
  let api: RegistrationAPI;
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    baseURL: string;
  };

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      baseURL: 'https://foreman.example.com/api/v2',
    };

    api = new RegistrationAPI(mockClient as any);
  });


  describe('generateCommand', () => {
    it('should call POST /registration_commands endpoint and return script', async () => {
      const params: RegistrationParams = {
        hostgroup_id: 1,
        organization_id: 2,
        insecure: true,
      };

      const mockScript = `#!/bin/bash
# Foreman registration script
curl -X POST "https://foreman.example.com/api/v2/register" \\
  -H "Authorization: Bearer embedded-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{"hostgroup_id":1,"organization_id":2,"insecure":true}'`;

      const mockResponse = { registration_command: mockScript };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await api.generateCommand(params);

      expect(mockClient.post).toHaveBeenCalledWith('/registration_commands', params);
      expect(result.script).toBe(mockScript);
      expect(result.parameters).toEqual(params);
    });

    it('should work with minimal parameters', async () => {
      const params: RegistrationParams = {};

      const mockScript = `#!/bin/bash
# Foreman registration script
curl -X POST "https://foreman.example.com/api/v2/register"`;

      const mockResponse = { registration_command: mockScript };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await api.generateCommand(params);

      expect(mockClient.post).toHaveBeenCalledWith('/registration_commands', params);
      expect(result.script).toBe(mockScript);
      expect(result.parameters).toEqual(params);
    });
  });

});