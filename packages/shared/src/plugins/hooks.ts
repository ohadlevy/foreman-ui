import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pluginRegistry } from './registry';
import { 
  ForemanPlugin, 
  ComponentExtension, 
  MenuItem, 
  DashboardWidget,
  PluginLoadState,
  PluginRoute
} from './types';

/**
 * Hook to subscribe to plugin registry changes
 */
const usePluginRegistryState = () => {
  const [updateCounter, setUpdateCounter] = useState(0);

  useEffect(() => {
    const unsubscribe = pluginRegistry.subscribe(() => {
      setUpdateCounter(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  return updateCounter;
};

/**
 * Hook to get all registered plugins
 */
export const usePlugins = (): ForemanPlugin[] => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => pluginRegistry.getAllPlugins(), [updateCounter]);
};

/**
 * Hook to get a specific plugin
 */
export const usePlugin = (name: string): ForemanPlugin | undefined => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => pluginRegistry.getPlugin(name), [name, updateCounter]);
};

/**
 * Hook to check if a plugin is registered
 */
export const usePluginRegistered = (name: string): boolean => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => pluginRegistry.isRegistered(name), [name, updateCounter]);
};

/**
 * Hook to get plugin load state
 */
export const usePluginLoadState = (): PluginLoadState => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => pluginRegistry.getLoadState(), [updateCounter]);
};

/**
 * Hook to get component extensions for an extension point
 */
export const usePluginExtensions = (extensionPoint: string): ComponentExtension[] => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => 
    pluginRegistry.getPluginsWithExtensions(extensionPoint), 
    [extensionPoint, updateCounter]
  );
};

/**
 * Hook to get all plugin menu items
 */
export const usePluginMenuItems = (): MenuItem[] => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => {
    const menuItems: MenuItem[] = [];
    pluginRegistry.getPluginsWithMenuItems().forEach(plugin => {
      if (plugin.menuItems) {
        menuItems.push(...plugin.menuItems);
      }
    });
    return menuItems.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [updateCounter]);
};

/**
 * Hook to get all dashboard widgets from plugins
 */
export const usePluginDashboardWidgets = (): DashboardWidget[] => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => pluginRegistry.getPluginsWithWidgets(), [updateCounter]);
};

/**
 * Hook to get plugin-specific translation function
 */
export const usePluginTranslation = (pluginName: string) => {
  const namespace = pluginRegistry.getPluginTranslationNamespace(pluginName);
  return useTranslation(namespace);
};

/**
 * Hook to register a plugin (typically used in plugin entry points)
 */
export const usePluginRegistration = (plugin: ForemanPlugin) => {
  useMemo(() => {
    if (!pluginRegistry.isRegistered(plugin.name)) {
      pluginRegistry.register(plugin).catch(error => {
        console.error(`Failed to register plugin ${plugin.name}:`, error);
      });
    }
  }, [plugin]);
};

/**
 * Hook to get plugin routes for router integration
 */
export const usePluginRoutes = () => {
  const updateCounter = usePluginRegistryState();
  return useMemo(() => {
    const routes: Array<PluginRoute & { pluginName: string; pluginDisplayName: string }> = [];
    pluginRegistry.getPluginsWithRoutes().forEach(plugin => {
      if (plugin.routes) {
        plugin.routes.forEach(route => {
          routes.push({
            ...route,
            // Add plugin context to route
            pluginName: plugin.name,
            pluginDisplayName: plugin.displayName
          });
        });
      }
    });
    return routes;
  }, [updateCounter]);
};