import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { ForemanPlugin, EXTENSION_POINTS } from '../types';

// Mock i18next with vi.mock factory pattern
vi.mock('i18next', () => ({
  default: {
    addResourceBundle: vi.fn(),
    removeResourceBundle: vi.fn(),
    t: vi.fn(),
    changeLanguage: vi.fn().mockResolvedValue(undefined),
    language: 'en'
  }
}));

// Import after mocking
import i18next from 'i18next';
import { ForemanPluginRegistry } from '../registry';

// Cast to get proper typing
const mockI18next = i18next as unknown as {
  addResourceBundle: MockedFunction<any>;
  removeResourceBundle: MockedFunction<any>;
  t: MockedFunction<any>;
  changeLanguage: MockedFunction<any>;
  language: string;
};

describe('ForemanPluginRegistry', () => {
  let registry: ForemanPluginRegistry;
  let mockPlugin: ForemanPlugin;

  beforeEach(() => {
    registry = new ForemanPluginRegistry();
    // Clear all mocks
    vi.clearAllMocks();

    mockPlugin = {
      name: 'foreman_test',
      version: '1.0.0',
      displayName: 'Test Plugin',
      description: 'A test plugin',
      author: 'Test Author',
      foremanVersions: ['>=3.0.0'],
      routes: [
        {
          path: '/test',
          element: () => null,
          permissions: ['view_test']
        }
      ],
      menuItems: [
        {
          id: 'test-menu',
          labelKey: 'menu.test',
          path: '/test',
          permissions: ['view_test']
        }
      ],
      permissions: [
        {
          name: 'view_test',
          resource_type: 'Test',
          actions: ['view'],
          descriptionKey: 'permissions.view_test'
        }
      ],
      componentExtensions: [
        {
          extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
          component: () => null,
          titleKey: 'test.tab_title',
          order: 10
        }
      ],
      dashboardWidgets: [
        {
          id: 'test-widget',
          titleKey: 'widgets.test',
          component: () => null,
          size: 'medium'
        }
      ],
      i18n: {
        domain: 'foreman_test',
        defaultLocale: 'en',
        supportedLocales: ['en', 'es'],
        keys: {
          'menu.test': 'Test Menu',
          'permissions.view_test': 'View test data',
          'test.tab_title': 'Test Tab',
          'widgets.test': 'Test Widget'
        }
      }
    };
  });

  describe('Plugin Registration', () => {
    it('should register a valid plugin successfully', async () => {
      await registry.register(mockPlugin);

      expect(registry.isRegistered('foreman_test')).toBe(true);
      expect(registry.getPlugin('foreman_test')).toEqual(mockPlugin);
      expect(registry.getAllPlugins()).toHaveLength(1);
    });

    it('should load translations when registering a plugin with i18n', async () => {
      await registry.register(mockPlugin);

      expect(mockI18next.addResourceBundle).toHaveBeenCalledWith(
        'en',
        'foreman_test',
        expect.objectContaining({
          'menu.test': 'Test Menu',
          'permissions.view_test': 'View test data'
        }),
        true,
        true
      );
    });

    it('should call plugin initialize function during registration', async () => {
      const initializeFn = vi.fn();
      const pluginWithInit = { ...mockPlugin, initialize: initializeFn };

      await registry.register(pluginWithInit);

      expect(initializeFn).toHaveBeenCalledWith(
        expect.objectContaining({
          apiClient: undefined,
          user: undefined,
          pluginRegistry: registry,
          i18n: expect.objectContaining({
            t: expect.any(Function),
            changeLanguage: expect.any(Function),
            language: 'en'
          })
        })
      );
    });

    it('should update load state on successful registration', async () => {
      await registry.register(mockPlugin);

      const loadState = registry.getLoadState();
      expect(loadState.loaded).toContain('foreman_test');
      expect(loadState.failed).toHaveLength(0);
    });

    it('should handle registration failures gracefully', async () => {
      const invalidPlugin = { ...mockPlugin, name: '' }; // Invalid name

      await expect(registry.register(invalidPlugin)).rejects.toThrow();

      const loadState = registry.getLoadState();
      expect(loadState.failed).toHaveLength(1);
      expect(loadState.failed[0].name).toBe('');
    });
  });

  describe('Plugin Validation', () => {
    it('should reject plugin without name', async () => {
      const invalidPlugin = { ...mockPlugin, name: '' };

      await expect(registry.register(invalidPlugin)).rejects.toThrow('Plugin must have a name');
    });

    it('should reject plugin without version', async () => {
      const invalidPlugin = { ...mockPlugin, version: '' };

      await expect(registry.register(invalidPlugin)).rejects.toThrow('Plugin must have a version');
    });

    it('should reject plugin without displayName', async () => {
      const invalidPlugin = { ...mockPlugin, displayName: '' };

      await expect(registry.register(invalidPlugin)).rejects.toThrow('Plugin must have a displayName');
    });

    it('should reject duplicate plugin names', async () => {
      await registry.register(mockPlugin);

      await expect(registry.register(mockPlugin)).rejects.toThrow('Plugin foreman_test is already registered');
    });

    it('should validate route structure', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        routes: [{ element: () => null }] // Missing path
      };

      await expect(registry.register(invalidPlugin)).rejects.toThrow('route at index 0 must have a path');
    });

    it('should validate menu item structure', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        menuItems: [{ id: 'test', path: '/test' }] // Missing label
      };

      await expect(registry.register(invalidPlugin)).rejects.toThrow('menu item at index 0 must have either label or labelKey');
    });

    it('should validate i18n configuration', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        i18n: {
          defaultLocale: '',
          supportedLocales: ['en'],
          keys: { 'test': 'Test' }
        }
      };

      await expect(registry.register(invalidPlugin)).rejects.toThrow('i18n config must have a defaultLocale');
    });
  });

  describe('Plugin Unregistration', () => {
    beforeEach(async () => {
      // Create a fresh registry to avoid conflicts
      registry = new ForemanPluginRegistry();
      await registry.register(mockPlugin);
    });

    it('should unregister a plugin successfully', async () => {
      await registry.unregister('foreman_test');

      expect(registry.isRegistered('foreman_test')).toBe(false);
      expect(registry.getPlugin('foreman_test')).toBeUndefined();
      expect(registry.getAllPlugins()).toHaveLength(0);
    });

    it('should call plugin destroy function during unregistration', async () => {
      registry = new ForemanPluginRegistry(); // Fresh registry
      const destroyFn = vi.fn();
      const pluginWithDestroy = {
        ...mockPlugin,
        name: 'foreman_destroy_test', // Different name to avoid conflicts
        destroy: destroyFn
      };

      await registry.register(pluginWithDestroy);
      await registry.unregister(pluginWithDestroy.name);

      expect(destroyFn).toHaveBeenCalled();
    });

    it('should remove translations during unregistration', async () => {
      await registry.unregister('foreman_test');

      expect(mockI18next.removeResourceBundle).toHaveBeenCalledWith('en', 'foreman_test');
    });

    it('should handle unregistering non-existent plugin gracefully', async () => {
      await expect(registry.unregister('non_existent')).resolves.toBeUndefined();
    });
  });

  describe('Plugin Queries', () => {
    beforeEach(async () => {
      registry = new ForemanPluginRegistry();
      await registry.register(mockPlugin);
    });

    it('should return plugins with routes', () => {
      const pluginsWithRoutes = registry.getPluginsWithRoutes();

      expect(pluginsWithRoutes).toHaveLength(1);
      expect(pluginsWithRoutes[0].name).toBe('foreman_test');
    });

    it('should return plugins with menu items', () => {
      const pluginsWithMenu = registry.getPluginsWithMenuItems();

      expect(pluginsWithMenu).toHaveLength(1);
      expect(pluginsWithMenu[0].name).toBe('foreman_test');
    });

    it('should return extensions for specific extension point', () => {
      const extensions = registry.getPluginsWithExtensions(EXTENSION_POINTS.HOST_DETAILS_TABS);

      expect(extensions).toHaveLength(1);
      expect(extensions[0].extensionPoint).toBe(EXTENSION_POINTS.HOST_DETAILS_TABS);
      expect(extensions[0].titleKey).toBe('test.tab_title');
    });

    it('should return dashboard widgets', () => {
      const widgets = registry.getPluginsWithWidgets();

      expect(widgets).toHaveLength(1);
      expect(widgets[0].id).toBe('test-widget');
      expect(widgets[0].titleKey).toBe('widgets.test');
    });

    it('should sort extensions by order', async () => {
      const secondPlugin = {
        ...mockPlugin,
        name: 'foreman_second',
        componentExtensions: [
          {
            extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
            component: () => null,
            titleKey: 'second.tab_title',
            order: 5 // Lower order, should come first
          }
        ],
        i18n: {
          domain: 'foreman_second',
          defaultLocale: 'en',
          supportedLocales: ['en'],
          keys: { 'second.tab_title': 'Second Tab' }
        }
      };

      await registry.register(secondPlugin);

      const extensions = registry.getPluginsWithExtensions(EXTENSION_POINTS.HOST_DETAILS_TABS);
      expect(extensions).toHaveLength(2);
      expect(extensions[0].order).toBe(5);
      expect(extensions[1].order).toBe(10);
    });
  });

  describe('Translation Management', () => {
    it('should get correct translation namespace', async () => {
      registry = new ForemanPluginRegistry();
      await registry.register(mockPlugin);

      const namespace = registry.getPluginTranslationNamespace('foreman_test');
      expect(namespace).toBe('foreman_test');
    });

    it('should fallback to plugin name if no domain specified', async () => {
      registry = new ForemanPluginRegistry();
      const pluginWithoutDomain = {
        ...mockPlugin,
        i18n: {
          ...mockPlugin.i18n!,
          domain: undefined
        }
      };

      await registry.register(pluginWithoutDomain);

      const namespace = registry.getPluginTranslationNamespace('foreman_test');
      expect(namespace).toBe('foreman_test');
    });

    it('should handle translation loading failures gracefully', async () => {
      registry = new ForemanPluginRegistry();
      mockI18next.addResourceBundle.mockImplementation(() => {
        throw new Error('Translation loading failed');
      });

      // Should not throw, but fall back to development keys
      await expect(registry.register(mockPlugin)).resolves.toBeUndefined();

      // Should still register the plugin
      expect(registry.isRegistered('foreman_test')).toBe(true);
    });
  });
});