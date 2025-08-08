import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  usePlugins,
  usePlugin,
  usePluginRegistered,
  usePluginExtensions,
  usePluginMenuItems,
  usePluginDashboardWidgets,
  usePluginRoutes
} from '../hooks';
import { pluginRegistry } from '../registry';
import { ForemanPlugin, EXTENSION_POINTS } from '../types';

// Mock the plugin registry
vi.mock('../registry', () => ({
  pluginRegistry: {
    getAllPlugins: vi.fn(),
    getPlugin: vi.fn(),
    isRegistered: vi.fn(),
    getPluginsWithExtensions: vi.fn(),
    getPluginsWithMenuItems: vi.fn(),
    getPluginsWithWidgets: vi.fn(),
    getPluginsWithRoutes: vi.fn(),
    getPluginTranslationNamespace: vi.fn(),
    subscribe: vi.fn(() => vi.fn()) // Mock subscribe method that returns unsubscribe function
  }
}));

// Mock our safe useTranslation wrapper
vi.mock('../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}));

const mockPluginRegistry = pluginRegistry as any;

describe('Plugin Hooks', () => {
  const mockPlugin: ForemanPlugin = {
    name: 'foreman_test',
    version: '1.0.0',
    displayName: 'Test Plugin',
    routes: [
      {
        path: '/test',
        element: () => null
      }
    ],
    menuItems: [
      {
        id: 'test-menu',
        labelKey: 'menu.test',
        path: '/test',
        order: 10
      }
    ],
    componentExtensions: [
      {
        extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
        component: () => null,
        titleKey: 'test.tab',
        order: 5
      }
    ],
    dashboardWidgets: [
      {
        id: 'test-widget',
        titleKey: 'widgets.test',
        component: () => null,
        size: 'medium'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePlugins', () => {
    it('should return all registered plugins', () => {
      mockPluginRegistry.getAllPlugins.mockReturnValue([mockPlugin]);

      const { result } = renderHook(() => usePlugins());

      expect(result.current).toEqual([mockPlugin]);
      expect(mockPluginRegistry.getAllPlugins).toHaveBeenCalled();
    });

    it('should return empty array when no plugins registered', () => {
      mockPluginRegistry.getAllPlugins.mockReturnValue([]);

      const { result } = renderHook(() => usePlugins());

      expect(result.current).toEqual([]);
    });
  });

  describe('usePlugin', () => {
    it('should return specific plugin by name', () => {
      mockPluginRegistry.getPlugin.mockReturnValue(mockPlugin);

      const { result } = renderHook(() => usePlugin('foreman_test'));

      expect(result.current).toEqual(mockPlugin);
      expect(mockPluginRegistry.getPlugin).toHaveBeenCalledWith('foreman_test');
    });

    it('should return undefined for non-existent plugin', () => {
      mockPluginRegistry.getPlugin.mockReturnValue(undefined);

      const { result } = renderHook(() => usePlugin('non_existent'));

      expect(result.current).toBeUndefined();
    });

    it('should update when plugin name changes', () => {
      mockPluginRegistry.getPlugin.mockImplementation((name: string) =>
        name === 'foreman_test' ? mockPlugin : undefined
      );

      const { result, rerender } = renderHook(
        ({ name }) => usePlugin(name),
        { initialProps: { name: 'foreman_test' } }
      );

      expect(result.current).toEqual(mockPlugin);

      rerender({ name: 'other_plugin' });
      expect(result.current).toBeUndefined();
    });
  });

  describe('usePluginRegistered', () => {
    it('should return true for registered plugin', () => {
      mockPluginRegistry.isRegistered.mockReturnValue(true);

      const { result } = renderHook(() => usePluginRegistered('foreman_test'));

      expect(result.current).toBe(true);
      expect(mockPluginRegistry.isRegistered).toHaveBeenCalledWith('foreman_test');
    });

    it('should return false for unregistered plugin', () => {
      mockPluginRegistry.isRegistered.mockReturnValue(false);

      const { result } = renderHook(() => usePluginRegistered('non_existent'));

      expect(result.current).toBe(false);
    });
  });

  describe('usePluginExtensions', () => {
    it('should return extensions for specific extension point', () => {
      const mockExtensions = [mockPlugin.componentExtensions![0]];
      mockPluginRegistry.getPluginsWithExtensions.mockReturnValue(mockExtensions);

      const { result } = renderHook(() =>
        usePluginExtensions(EXTENSION_POINTS.HOST_DETAILS_TABS)
      );

      expect(result.current).toEqual(mockExtensions);
      expect(mockPluginRegistry.getPluginsWithExtensions).toHaveBeenCalledWith(
        EXTENSION_POINTS.HOST_DETAILS_TABS
      );
    });

    it('should return empty array when no extensions exist', () => {
      mockPluginRegistry.getPluginsWithExtensions.mockReturnValue([]);

      const { result } = renderHook(() =>
        usePluginExtensions(EXTENSION_POINTS.DASHBOARD_WIDGETS)
      );

      expect(result.current).toEqual([]);
    });
  });

  describe('usePluginMenuItems', () => {
    it('should return sorted menu items from all plugins', () => {
      const plugins = [
        {
          ...mockPlugin,
          menuItems: [
            { id: 'item1', labelKey: 'menu.item1', order: 20 },
            { id: 'item2', labelKey: 'menu.item2', order: 10 }
          ]
        }
      ];
      mockPluginRegistry.getPluginsWithMenuItems.mockReturnValue(plugins);

      const { result } = renderHook(() => usePluginMenuItems());

      expect(result.current).toHaveLength(2);
      expect(result.current[0].order).toBe(10);
      expect(result.current[1].order).toBe(20);
    });

    it('should handle plugins without menu items', () => {
      mockPluginRegistry.getPluginsWithMenuItems.mockReturnValue([]);

      const { result } = renderHook(() => usePluginMenuItems());

      expect(result.current).toEqual([]);
    });

    it('should handle undefined order values', () => {
      const plugins = [
        {
          ...mockPlugin,
          menuItems: [
            { id: 'item1', labelKey: 'menu.item1' }, // No order
            { id: 'item2', labelKey: 'menu.item2', order: 10 }
          ]
        }
      ];
      mockPluginRegistry.getPluginsWithMenuItems.mockReturnValue(plugins);

      const { result } = renderHook(() => usePluginMenuItems());

      expect(result.current).toHaveLength(2);
      // Items without order should default to 0
      expect(result.current[0].order).toBeUndefined();
      expect(result.current[1].order).toBe(10);
    });
  });

  describe('usePluginDashboardWidgets', () => {
    it('should return all dashboard widgets from plugins', () => {
      const mockWidgets = [mockPlugin.dashboardWidgets![0]];
      mockPluginRegistry.getPluginsWithWidgets.mockReturnValue(mockWidgets);

      const { result } = renderHook(() => usePluginDashboardWidgets());

      expect(result.current).toEqual(mockWidgets);
      expect(mockPluginRegistry.getPluginsWithWidgets).toHaveBeenCalled();
    });

    it('should return empty array when no widgets exist', () => {
      mockPluginRegistry.getPluginsWithWidgets.mockReturnValue([]);

      const { result } = renderHook(() => usePluginDashboardWidgets());

      expect(result.current).toEqual([]);
    });
  });

  describe('usePluginRoutes', () => {
    it('should return routes with plugin context', () => {
      const plugins = [mockPlugin];
      mockPluginRegistry.getPluginsWithRoutes.mockReturnValue(plugins);

      const { result } = renderHook(() => usePluginRoutes());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toMatchObject({
        path: '/test',
        pluginName: 'foreman_test',
        pluginDisplayName: 'Test Plugin'
      });
    });

    it('should handle multiple plugins with multiple routes', () => {
      const plugins = [
        {
          ...mockPlugin,
          routes: [
            { path: '/test1', element: () => null },
            { path: '/test2', element: () => null }
          ]
        },
        {
          ...mockPlugin,
          name: 'foreman_other',
          displayName: 'Other Plugin',
          routes: [
            { path: '/other', element: () => null }
          ]
        }
      ];
      mockPluginRegistry.getPluginsWithRoutes.mockReturnValue(plugins);

      const { result } = renderHook(() => usePluginRoutes());

      expect(result.current).toHaveLength(3);
      expect(result.current[0].path).toBe('/test1');
      expect(result.current[1].path).toBe('/test2');
      expect(result.current[2].path).toBe('/other');
      expect(result.current[2].pluginName).toBe('foreman_other');
    });

    it('should return empty array when no routes exist', () => {
      mockPluginRegistry.getPluginsWithRoutes.mockReturnValue([]);

      const { result } = renderHook(() => usePluginRoutes());

      expect(result.current).toEqual([]);
    });
  });

  describe('Memoization', () => {
    it('should memoize results and return consistent references', () => {
      const plugins = [mockPlugin];
      mockPluginRegistry.getAllPlugins.mockReturnValue(plugins);

      const { result, rerender } = renderHook(() => usePlugins());
      const firstResult = result.current;

      // Same plugins data should return same reference due to useMemo
      expect(result.current).toEqual(plugins);

      rerender();

      // After rerender with same data, should get same reference
      expect(result.current).toBe(firstResult);

      // Registry method should be called (useMemo still calls the function to check dependencies)
      expect(mockPluginRegistry.getAllPlugins).toHaveBeenCalled();
    });
  });
});