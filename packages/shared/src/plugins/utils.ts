import { ComponentExtension, MenuItem, PluginPermission } from './types';

/**
 * Check if user has required permissions for a plugin feature
 */
export const hasPluginPermissions = (
  requiredPermissions: string[] | undefined,
  userPermissions: PluginPermission[]
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  return requiredPermissions.every(required => 
    userPermissions.some(userPerm => userPerm.name === required)
  );
};

/**
 * Filter menu items based on user permissions
 */
export const filterMenuItemsByPermissions = (
  menuItems: MenuItem[],
  userPermissions: PluginPermission[]
): MenuItem[] => {
  return menuItems.filter(item => 
    hasPluginPermissions(item.permissions, userPermissions)
  ).map(item => ({
    ...item,
    children: item.children 
      ? filterMenuItemsByPermissions(item.children, userPermissions)
      : undefined
  }));
};

/**
 * Filter component extensions based on user permissions and conditions
 */
export const filterExtensionsByPermissions = (
  extensions: ComponentExtension[],
  userPermissions: PluginPermission[],
  context?: unknown
): ComponentExtension[] => {
  return extensions.filter(extension => {
    // Check permissions
    if (!hasPluginPermissions(extension.permissions, userPermissions)) {
      return false;
    }
    
    // Check condition function
    if (extension.condition && context) {
      return extension.condition(context);
    }
    
    return true;
  });
};

/**
 * Sort menu items by order and create hierarchy
 */
export const buildMenuHierarchy = (menuItems: MenuItem[]): MenuItem[] => {
  // First, sort by order
  const sortedItems = [...menuItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Create a map for quick lookup
  const itemMap = new Map<string, MenuItem>();
  sortedItems.forEach(item => itemMap.set(item.id, { ...item, children: [] }));
  
  // Build hierarchy
  const rootItems: MenuItem[] = [];
  
  sortedItems.forEach(item => {
    const menuItem = itemMap.get(item.id)!;
    
    if (item.parent) {
      const parent = itemMap.get(item.parent);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(menuItem);
      } else {
        // Parent not found, treat as root item
        rootItems.push(menuItem);
      }
    } else {
      rootItems.push(menuItem);
    }
  });
  
  return rootItems;
};

/**
 * Validate plugin name format
 */
export const isValidPluginName = (name: string): boolean => {
  // Plugin names should start with 'foreman_' and contain only lowercase letters, numbers, and underscores
  return /^foreman_[a-z0-9_]+$/.test(name);
};

/**
 * Generate plugin namespace for i18n
 */
export const generatePluginNamespace = (pluginName: string): string => {
  return `plugin-${pluginName}`;
};

/**
 * Merge plugin configurations (useful for plugin inheritance or composition)
 */
export const mergePluginConfigs = <T extends Record<string, unknown>>(
  base: T, 
  override: Partial<T>
): T => {
  const merged = { ...base };
  
  Object.keys(override).forEach(key => {
    const overrideValue = override[key];
    if (Array.isArray(overrideValue)) {
      // For arrays, concatenate
      const baseArray = Array.isArray(base[key]) ? base[key] as unknown[] : [];
      (merged as Record<string, unknown>)[key] = [...baseArray, ...overrideValue];
    } else if (typeof overrideValue === 'object' && overrideValue !== null) {
      // For objects, merge recursively
      const baseObj = typeof base[key] === 'object' && base[key] !== null 
        ? base[key] as Record<string, unknown> 
        : {};
      (merged as Record<string, unknown>)[key] = mergePluginConfigs(
        baseObj, 
        overrideValue as Record<string, unknown>
      );
    } else {
      // For primitives, override
      (merged as Record<string, unknown>)[key] = overrideValue;
    }
  });
  
  return merged;
};

/**
 * Extract plugin name from package name (e.g., '@foreman/plugin-ansible' -> 'foreman_ansible')
 */
export const extractPluginName = (packageName: string): string => {
  // Handle scoped packages
  if (packageName.startsWith('@foreman/plugin-')) {
    return packageName.replace('@foreman/plugin-', 'foreman_').replace(/-/g, '_');
  }
  
  // Handle regular packages
  if (packageName.startsWith('foreman-')) {
    return packageName.replace('foreman-', 'foreman_').replace(/-/g, '_');
  }
  
  return packageName;
};

/**
 * Create a plugin development template
 */
export const createPluginTemplate = (name: string, displayName: string) => {
  return {
    name,
    version: '1.0.0',
    displayName,
    description: `${displayName} plugin for Foreman`,
    author: 'Plugin Developer',
    foremanVersions: ['>=3.0.0'],
    routes: [],
    menuItems: [],
    permissions: [],
    componentExtensions: [],
    dashboardWidgets: [],
    i18n: {
      defaultLocale: 'en',
      supportedLocales: ['en'],
      resources: {
        en: {
          [name]: {
            title: displayName,
            description: `${displayName} plugin for Foreman`
          }
        }
      }
    }
  };
};