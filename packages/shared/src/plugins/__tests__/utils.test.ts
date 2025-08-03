import { describe, it, expect } from 'vitest';
import {
  hasPluginPermissions,
  filterMenuItemsByPermissions,
  filterExtensionsByPermissions,
  buildMenuHierarchy,
  isValidPluginName,
  generatePluginNamespace,
  mergePluginConfigs,
  extractPluginName,
  createPluginTemplate
} from '../utils';
import { MenuItem, PluginPermission, EXTENSION_POINTS } from '../types';

// Define ComponentExtension interface for testing
interface ComponentExtension {
  extensionPoint: string;
  component: () => null;
  permissions?: string[];
  condition?: (context: unknown) => boolean;
}

describe('Plugin Utils', () => {
  const mockPermissions: PluginPermission[] = [
    { name: 'view_hosts', resource_type: 'Host', actions: ['view'] },
    { name: 'edit_hosts', resource_type: 'Host', actions: ['edit'] },
    { name: 'view_users', resource_type: 'User', actions: ['view'] }
  ];

  describe('hasPluginPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const requiredPermissions = ['view_hosts', 'view_users'];
      
      const result = hasPluginPermissions(requiredPermissions, mockPermissions);
      
      expect(result).toBe(true);
    });

    it('should return false when user is missing some permissions', () => {
      const requiredPermissions = ['view_hosts', 'delete_hosts'];
      
      const result = hasPluginPermissions(requiredPermissions, mockPermissions);
      
      expect(result).toBe(false);
    });

    it('should return true when no permissions are required', () => {
      const result = hasPluginPermissions(undefined, mockPermissions);
      
      expect(result).toBe(true);
    });

    it('should return true when required permissions array is empty', () => {
      const result = hasPluginPermissions([], mockPermissions);
      
      expect(result).toBe(true);
    });

    it('should return false when user has no permissions but some are required', () => {
      const result = hasPluginPermissions(['view_hosts'], []);
      
      expect(result).toBe(false);
    });
  });

  describe('filterMenuItemsByPermissions', () => {
    const mockMenuItems: MenuItem[] = [
      {
        id: 'hosts',
        label: 'Hosts',
        permissions: ['view_hosts']
      },
      {
        id: 'users',
        label: 'Users',
        permissions: ['view_users']
      },
      {
        id: 'admin',
        label: 'Admin',
        permissions: ['admin_access']
      },
      {
        id: 'public',
        label: 'Public'
        // No permissions required
      }
    ];

    it('should filter menu items based on user permissions', () => {
      const filtered = filterMenuItemsByPermissions(mockMenuItems, mockPermissions);
      
      expect(filtered).toHaveLength(3);
      expect(filtered.map(item => item.id)).toEqual(['hosts', 'users', 'public']);
    });

    it('should filter nested menu items', () => {
      const nestedMenuItems: MenuItem[] = [
        {
          id: 'parent',
          label: 'Parent',
          children: [
            {
              id: 'child1',
              label: 'Child 1',
              permissions: ['view_hosts']
            },
            {
              id: 'child2',
              label: 'Child 2',
              permissions: ['admin_access']
            }
          ]
        }
      ];

      const filtered = filterMenuItemsByPermissions(nestedMenuItems, mockPermissions);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].children).toHaveLength(1);
      expect(filtered[0].children![0].id).toBe('child1');
    });

    it('should return empty array when user has no matching permissions', () => {
      const restrictedItems: MenuItem[] = [
        {
          id: 'admin',
          label: 'Admin',
          permissions: ['admin_access']
        }
      ];

      const filtered = filterMenuItemsByPermissions(restrictedItems, mockPermissions);
      
      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterExtensionsByPermissions', () => {
    const mockExtensions: ComponentExtension[] = [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: () => null,
        permissions: ['view_hosts']
      },
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: () => null,
        permissions: ['admin_access']
      },
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: () => null,
        condition: (context) => {
          const hostContext = context as { hostId?: string } | undefined;
          return hostContext?.hostId === '123';
        }
      }
    ];

    it('should filter extensions by permissions', () => {
      const filtered = filterExtensionsByPermissions(mockExtensions, mockPermissions);
      
      expect(filtered).toHaveLength(2); // view_hosts and condition-based
    });

    it('should filter extensions by condition function', () => {
      const context = { hostId: '123' };
      const filtered = filterExtensionsByPermissions(mockExtensions, mockPermissions, context);
      
      expect(filtered).toHaveLength(2);
    });

    it('should filter out extensions when condition returns false', () => {
      const context = { hostId: '456' };
      const filtered = filterExtensionsByPermissions(mockExtensions, mockPermissions, context);
      
      expect(filtered).toHaveLength(1); // Only the one with view_hosts permission
    });
  });

  describe('buildMenuHierarchy', () => {
    const flatMenuItems: MenuItem[] = [
      { id: 'parent1', label: 'Parent 1', order: 20 },
      { id: 'child1', label: 'Child 1', parent: 'parent1', order: 10 },
      { id: 'child2', label: 'Child 2', parent: 'parent1', order: 5 },
      { id: 'parent2', label: 'Parent 2', order: 10 },
      { id: 'orphan', label: 'Orphan', parent: 'nonexistent' }
    ];

    it('should build hierarchical menu structure', () => {
      const hierarchy = buildMenuHierarchy(flatMenuItems);
      
      expect(hierarchy).toHaveLength(3); // parent2, parent1, orphan
      
      const parent1 = hierarchy.find(item => item.id === 'parent1');
      expect(parent1?.children).toHaveLength(2);
      expect(parent1?.children![0].id).toBe('child2'); // Order 5 comes first
      expect(parent1?.children![1].id).toBe('child1'); // Order 10 comes second
    });

    it('should sort items by order', () => {
      const hierarchy = buildMenuHierarchy(flatMenuItems);
      
      // Items should be sorted by order: parent2 (10), parent1 (20), orphan (undefined = 0)
      expect(hierarchy.map(item => item.id)).toEqual(['orphan', 'parent2', 'parent1']);
    });

    it('should handle items with missing parents as root items', () => {
      const hierarchy = buildMenuHierarchy(flatMenuItems);
      
      const orphan = hierarchy.find(item => item.id === 'orphan');
      expect(orphan).toBeDefined();
    });

    it('should handle items without order values', () => {
      const itemsWithoutOrder: MenuItem[] = [
        { id: 'item1', label: 'Item 1' },
        { id: 'item2', label: 'Item 2', order: 5 }
      ];

      const hierarchy = buildMenuHierarchy(itemsWithoutOrder);
      
      expect(hierarchy).toHaveLength(2);
      expect(hierarchy[0].id).toBe('item1'); // No order (0) comes first
      expect(hierarchy[1].id).toBe('item2'); // Order 5 comes second
    });
  });

  describe('isValidPluginName', () => {
    it('should validate correct plugin names', () => {
      expect(isValidPluginName('foreman_ansible')).toBe(true);
      expect(isValidPluginName('foreman_remote_execution')).toBe(true);
      expect(isValidPluginName('foreman_openscap')).toBe(true);
      expect(isValidPluginName('foreman_test123')).toBe(true);
    });

    it('should reject invalid plugin names', () => {
      expect(isValidPluginName('ansible')).toBe(false); // Missing foreman_ prefix
      expect(isValidPluginName('foreman-ansible')).toBe(false); // Dashes not allowed
      expect(isValidPluginName('foreman_Ansible')).toBe(false); // Uppercase not allowed
      expect(isValidPluginName('foreman_')).toBe(false); // Empty after prefix
      expect(isValidPluginName('')).toBe(false); // Empty string
    });
  });

  describe('generatePluginNamespace', () => {
    it('should generate correct namespace for plugin', () => {
      expect(generatePluginNamespace('foreman_ansible')).toBe('plugin-foreman_ansible');
      expect(generatePluginNamespace('test_plugin')).toBe('plugin-test_plugin');
    });
  });

  describe('mergePluginConfigs', () => {
    it('should merge plugin configurations correctly', () => {
      const base = {
        routes: [{ path: '/base' }],
        permissions: ['base_perm'],
        settings: { enabled: true }
      };

      const override = {
        routes: [{ path: '/override' }],
        permissions: ['override_perm'],
        settings: { debug: true }
      };

      const merged = mergePluginConfigs(base, override);

      expect(merged.routes).toEqual([{ path: '/base' }, { path: '/override' }]);
      expect(merged.permissions).toEqual(['base_perm', 'override_perm']);
      expect(merged.settings).toEqual({ enabled: true, debug: true });
    });

    it('should override primitive values', () => {
      const base = { name: 'Base Plugin', version: '1.0.0' };
      const override = { version: '2.0.0', description: 'Updated plugin' };

      const merged = mergePluginConfigs(base, override);

      expect(merged).toEqual({
        name: 'Base Plugin',
        version: '2.0.0',
        description: 'Updated plugin'
      });
    });

    it('should handle nested object merging', () => {
      interface PluginConfig extends Record<string, unknown> {
        config: {
          api?: { timeout?: number; retries?: number };
          ui?: { theme?: string };
          features?: { newFeature?: boolean };
        };
      }

      const base: PluginConfig = {
        config: {
          api: { timeout: 5000 },
          ui: { theme: 'light' }
        }
      };

      const override: PluginConfig = {
        config: {
          api: { retries: 3 },
          features: { newFeature: true }
        }
      };

      const merged = mergePluginConfigs(base, override) as PluginConfig;

      expect(merged.config.api).toEqual({ timeout: 5000, retries: 3 });
      expect(merged.config.ui).toEqual({ theme: 'light' });
      expect(merged.config.features).toEqual({ newFeature: true });
    });
  });

  describe('extractPluginName', () => {
    it('should extract plugin name from scoped package names', () => {
      expect(extractPluginName('@foreman/plugin-ansible')).toBe('foreman_ansible');
      expect(extractPluginName('@foreman/plugin-remote-execution')).toBe('foreman_remote_execution');
    });

    it('should extract plugin name from regular package names', () => {
      expect(extractPluginName('foreman-ansible')).toBe('foreman_ansible');
      expect(extractPluginName('foreman-remote-execution')).toBe('foreman_remote_execution');
    });

    it('should return original name if no pattern matches', () => {
      expect(extractPluginName('some-other-package')).toBe('some-other-package');
      expect(extractPluginName('foreman_ansible')).toBe('foreman_ansible');
    });
  });

  describe('createPluginTemplate', () => {
    it('should create a valid plugin template', () => {
      const template = createPluginTemplate('foreman_test', 'Test Plugin');

      expect(template.name).toBe('foreman_test');
      expect(template.displayName).toBe('Test Plugin');
      expect(template.version).toBe('1.0.0');
      expect(template.description).toBe('Test Plugin plugin for Foreman');
      expect(template.author).toBe('Plugin Developer');
      expect(template.foremanVersions).toEqual(['>=3.0.0']);
      
      // Check arrays are initialized
      expect(template.routes).toEqual([]);
      expect(template.menuItems).toEqual([]);
      expect(template.permissions).toEqual([]);
      expect(template.componentExtensions).toEqual([]);
      expect(template.dashboardWidgets).toEqual([]);
      
      // Check i18n configuration
      expect(template.i18n?.defaultLocale).toBe('en');
      expect(template.i18n?.supportedLocales).toEqual(['en']);
      expect(template.i18n?.keys.title).toBe('Test Plugin');
    });
  });
});