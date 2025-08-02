import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store';
import { act } from '@testing-library/react';

describe('Foreman Permissions and Roles', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Built-in Foreman Roles', () => {
    it('should handle Administrator role with all permissions', () => {
      const adminUser = {
        id: 1,
        login: 'admin',
        firstname: 'Foreman',
        lastname: 'Administrator',
        mail: 'admin@example.com',
        admin: true,
        disabled: false,
        effective_admin: true,
        auth_source_id: 1,
        organizations: [
          { id: 1, name: 'Default Organization', title: 'Default Organization' }
        ],
        locations: [
          { id: 2, name: 'Default Location', title: 'Default Location' }
        ],
        roles: [
          {
            id: 1,
            name: 'Administrator',
            builtin: true,
            permissions: [] // Admin doesn't need explicit permissions
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(adminUser);
      });

      const { hasPermission, isAdmin } = useAuthStore.getState();

      // Admin should have all permissions
      expect(isAdmin()).toBe(true);
      expect(hasPermission('view_hosts')).toBe(true);
      expect(hasPermission('create_hosts')).toBe(true);
      expect(hasPermission('edit_hosts')).toBe(true);
      expect(hasPermission('destroy_hosts')).toBe(true);
      expect(hasPermission('view_users')).toBe(true);
      expect(hasPermission('create_users')).toBe(true);
      expect(hasPermission('view_organizations')).toBe(true);
      expect(hasPermission('manage_settings')).toBe(true);
    });

    it('should handle Manager role permissions', () => {
      const managerUser = {
        id: 2,
        login: 'manager',
        firstname: 'Site',
        lastname: 'Manager',
        mail: 'manager@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [
          { id: 1, name: 'Production', title: 'Production Environment' }
        ],
        locations: [
          { id: 1, name: 'Main Datacenter', title: 'Main Datacenter' }
        ],
        roles: [
          {
            id: 2,
            name: 'Manager',
            builtin: false,
            permissions: [
              { id: 1, name: 'view_hosts', resource_type: 'Host' },
              { id: 2, name: 'create_hosts', resource_type: 'Host' },
              { id: 3, name: 'edit_hosts', resource_type: 'Host' },
              { id: 4, name: 'destroy_hosts', resource_type: 'Host' },
              { id: 5, name: 'view_hostgroups', resource_type: 'Hostgroup' },
              { id: 6, name: 'create_hostgroups', resource_type: 'Hostgroup' },
              { id: 7, name: 'edit_hostgroups', resource_type: 'Hostgroup' },
              { id: 8, name: 'view_environments', resource_type: 'Environment' },
              { id: 9, name: 'view_reports', resource_type: 'Report' },
              { id: 10, name: 'destroy_reports', resource_type: 'Report' },
              { id: 11, name: 'upload_facts', resource_type: 'Host' },
              { id: 12, name: 'view_facts', resource_type: 'Host' }
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(managerUser);
      });

      const { hasPermission, isAdmin } = useAuthStore.getState();

      expect(isAdmin()).toBe(false);
      
      // Manager should have host management permissions
      expect(hasPermission('view_hosts')).toBe(true);
      expect(hasPermission('create_hosts')).toBe(true);
      expect(hasPermission('edit_hosts')).toBe(true);
      expect(hasPermission('destroy_hosts')).toBe(true);
      expect(hasPermission('view_hostgroups')).toBe(true);
      expect(hasPermission('view_reports')).toBe(true);
      
      // But not user management
      expect(hasPermission('view_users')).toBe(false);
      expect(hasPermission('create_users')).toBe(false);
      expect(hasPermission('manage_settings')).toBe(false);
    });

    it('should handle Viewer role permissions', () => {
      const viewerUser = {
        id: 3,
        login: 'viewer',
        firstname: 'Read',
        lastname: 'Only',
        mail: 'viewer@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [
          { id: 2, name: 'Development', title: 'Development Environment' }
        ],
        locations: [
          { id: 2, name: 'Dev Lab', title: 'Development Lab' }
        ],
        roles: [
          {
            id: 3,
            name: 'Viewer',
            builtin: false,
            permissions: [
              { id: 13, name: 'view_hosts', resource_type: 'Host' },
              { id: 14, name: 'view_hostgroups', resource_type: 'Hostgroup' },
              { id: 15, name: 'view_environments', resource_type: 'Environment' },
              { id: 16, name: 'view_reports', resource_type: 'Report' },
              { id: 17, name: 'view_facts', resource_type: 'Host' },
              { id: 18, name: 'view_organizations', resource_type: 'Organization' },
              { id: 19, name: 'view_locations', resource_type: 'Location' }
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(viewerUser);
      });

      const { hasPermission } = useAuthStore.getState();

      // Viewer should have read permissions
      expect(hasPermission('view_hosts')).toBe(true);
      expect(hasPermission('view_hostgroups')).toBe(true);
      expect(hasPermission('view_reports')).toBe(true);
      expect(hasPermission('view_organizations')).toBe(true);
      
      // But no write permissions
      expect(hasPermission('create_hosts')).toBe(false);
      expect(hasPermission('edit_hosts')).toBe(false);
      expect(hasPermission('destroy_hosts')).toBe(false);
      expect(hasPermission('create_hostgroups')).toBe(false);
    });
  });

  describe('Custom Foreman Roles', () => {
    it('should handle Host Manager role', () => {
      const hostManagerUser = {
        id: 4,
        login: 'host_manager',
        firstname: 'Host',
        lastname: 'Manager',
        mail: 'hostmgr@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: [
          {
            id: 10,
            name: 'Host Manager',
            builtin: false,
            permissions: [
              { id: 20, name: 'view_hosts', resource_type: 'Host' },
              { id: 21, name: 'create_hosts', resource_type: 'Host' },
              { id: 22, name: 'edit_hosts', resource_type: 'Host' },
              { id: 23, name: 'power_hosts', resource_type: 'Host' },
              { id: 24, name: 'console_hosts', resource_type: 'Host' },
              { id: 25, name: 'build_hosts', resource_type: 'Host' },
              { id: 26, name: 'view_facts', resource_type: 'Host' },
              { id: 27, name: 'upload_facts', resource_type: 'Host' }
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(hostManagerUser);
      });

      const { hasPermission } = useAuthStore.getState();

      // Should have host-specific permissions
      expect(hasPermission('view_hosts')).toBe(true);
      expect(hasPermission('create_hosts')).toBe(true);
      expect(hasPermission('edit_hosts')).toBe(true);
      expect(hasPermission('power_hosts')).toBe(true);
      expect(hasPermission('console_hosts')).toBe(true);
      expect(hasPermission('build_hosts')).toBe(true);
      
      // But not other resources
      expect(hasPermission('view_users')).toBe(false);
      expect(hasPermission('view_organizations')).toBe(false);
      expect(hasPermission('destroy_hosts')).toBe(false);
    });

    it('should handle Compliance Auditor role', () => {
      const auditorUser = {
        id: 5,
        login: 'auditor',
        firstname: 'Compliance',
        lastname: 'Auditor',
        mail: 'auditor@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: [
          {
            id: 11,
            name: 'Compliance Auditor',
            builtin: false,
            permissions: [
              { id: 28, name: 'view_hosts', resource_type: 'Host' },
              { id: 29, name: 'view_reports', resource_type: 'Report' },
              { id: 30, name: 'view_config_reports', resource_type: 'ConfigReport' },
              { id: 31, name: 'view_compliance_reports', resource_type: 'ComplianceReport' },
              { id: 32, name: 'view_facts', resource_type: 'Host' },
              { id: 33, name: 'view_audit_logs', resource_type: 'Audit' },
              { id: 34, name: 'view_organizations', resource_type: 'Organization' },
              { id: 35, name: 'view_locations', resource_type: 'Location' }
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(auditorUser);
      });

      const { hasPermission } = useAuthStore.getState();

      // Should have audit/compliance permissions
      expect(hasPermission('view_hosts')).toBe(true);
      expect(hasPermission('view_reports')).toBe(true);
      expect(hasPermission('view_config_reports')).toBe(true);
      expect(hasPermission('view_compliance_reports')).toBe(true);
      expect(hasPermission('view_audit_logs')).toBe(true);
      
      // But no write permissions
      expect(hasPermission('create_hosts')).toBe(false);
      expect(hasPermission('edit_hosts')).toBe(false);
      expect(hasPermission('destroy_reports')).toBe(false);
    });
  });

  describe('Resource-Specific Permissions', () => {
    it('should validate permissions with resource types', () => {
      const mixedPermissionUser = {
        id: 6,
        login: 'mixed_user',
        firstname: 'Mixed',
        lastname: 'Permissions',
        mail: 'mixed@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: [
          {
            id: 12,
            name: 'Mixed Role',
            builtin: false,
            permissions: [
              { id: 36, name: 'view_hosts', resource_type: 'Host' },
              { id: 37, name: 'view_users', resource_type: 'User' },
              { id: 38, name: 'edit_hosts', resource_type: 'Host' },
              { id: 39, name: 'view_reports', resource_type: 'Report' }
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(mixedPermissionUser);
      });

      const { hasPermission } = useAuthStore.getState();

      // Test resource-specific permissions
      expect(hasPermission('view_hosts', 'Host')).toBe(true);
      expect(hasPermission('view_users', 'User')).toBe(true);
      expect(hasPermission('edit_hosts', 'Host')).toBe(true);
      expect(hasPermission('view_reports', 'Report')).toBe(true);
      
      // Test wrong resource type
      expect(hasPermission('view_hosts', 'User')).toBe(false);
      expect(hasPermission('view_users', 'Host')).toBe(false);
      
      // Test non-existent permissions
      expect(hasPermission('destroy_hosts', 'Host')).toBe(false);
      expect(hasPermission('create_users', 'User')).toBe(false);
    });
  });

  describe('Multiple Roles Scenario', () => {
    it('should handle user with multiple roles', () => {
      const multiRoleUser = {
        id: 7,
        login: 'multi_role',
        firstname: 'Multi',
        lastname: 'Role',
        mail: 'multi@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: [
          {
            id: 13,
            name: 'Basic Viewer',
            builtin: false,
            permissions: [
              { id: 40, name: 'view_hosts', resource_type: 'Host' },
              { id: 41, name: 'view_reports', resource_type: 'Report' }
            ]
          },
          {
            id: 14,
            name: 'Environment Manager',
            builtin: false,
            permissions: [
              { id: 42, name: 'view_environments', resource_type: 'Environment' },
              { id: 43, name: 'create_environments', resource_type: 'Environment' },
              { id: 44, name: 'edit_environments', resource_type: 'Environment' }
            ]
          },
          {
            id: 15,
            name: 'Puppet Class Viewer',
            builtin: false,
            permissions: [
              { id: 45, name: 'view_puppetclasses', resource_type: 'Puppetclass' },
              { id: 46, name: 'view_external_variables', resource_type: 'VariableLookupKey' }
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(multiRoleUser);
      });

      const { hasPermission } = useAuthStore.getState();

      // Should have permissions from all roles
      expect(hasPermission('view_hosts')).toBe(true);
      expect(hasPermission('view_reports')).toBe(true);
      expect(hasPermission('view_environments')).toBe(true);
      expect(hasPermission('create_environments')).toBe(true);
      expect(hasPermission('edit_environments')).toBe(true);
      expect(hasPermission('view_puppetclasses')).toBe(true);
      expect(hasPermission('view_external_variables')).toBe(true);
      
      // Should not have permissions not granted by any role
      expect(hasPermission('destroy_hosts')).toBe(false);
      expect(hasPermission('create_puppetclasses')).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle user with no roles', () => {
      const noRoleUser = {
        id: 8,
        login: 'no_roles',
        firstname: 'No',
        lastname: 'Roles',
        mail: 'noroles@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: []
      };

      act(() => {
        useAuthStore.getState().setUser(noRoleUser);
      });

      const { hasPermission, isAdmin } = useAuthStore.getState();

      expect(isAdmin()).toBe(false);
      expect(hasPermission('view_hosts')).toBe(false);
      expect(hasPermission('view_reports')).toBe(false);
      expect(hasPermission('view_users')).toBe(false);
    });

    it('should handle role with empty permissions', () => {
      const emptyRoleUser = {
        id: 9,
        login: 'empty_role',
        firstname: 'Empty',
        lastname: 'Role',
        mail: 'empty@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: [
          {
            id: 16,
            name: 'Empty Role',
            builtin: false,
            permissions: []
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(emptyRoleUser);
      });

      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('view_hosts')).toBe(false);
      expect(hasPermission('view_reports')).toBe(false);
    });

    it('should handle malformed permission data gracefully', () => {
      const malformedUser = {
        id: 10,
        login: 'malformed',
        firstname: 'Malformed',
        lastname: 'Data',
        mail: 'malformed@example.com',
        admin: false,
        disabled: false,
        effective_admin: false,
        auth_source_id: 1,
        organizations: [],
        locations: [],
        roles: [
          {
            id: 17,
            name: 'Malformed Role',
            builtin: false,
            permissions: [
              { id: 47, name: 'view_hosts' }, // Missing resource_type
              { id: 48, resource_type: 'Host' }, // Missing name
              null, // Null permission
              undefined // Undefined permission
            ]
          }
        ]
      };

      act(() => {
        useAuthStore.getState().setUser(malformedUser as any);
      });

      const { hasPermission } = useAuthStore.getState();

      // Should handle gracefully and not crash
      expect(hasPermission('view_hosts')).toBe(true); // Should match despite missing resource_type
      expect(hasPermission('create_hosts')).toBe(false);
    });
  });
});