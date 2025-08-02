import { ComponentType } from 'react';

/**
 * Props passed to plugin route components
 */
export interface PluginRouteProps {
  pluginName?: string;
  pluginDisplayName?: string;
}

/**
 * Props passed to dashboard widget components
 */
export interface DashboardWidgetProps {
  widgetId?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Props passed to extension components
 */
export interface ExtensionComponentProps {
  context?: unknown;
  extensionPoint?: string;
  [key: string]: unknown;
}
import { RouteObject } from 'react-router-dom';

/**
 * Core plugin interface - mirrors Foreman's plugin concepts in React
 */
export interface ForemanPlugin {
  /** Unique plugin identifier (e.g., 'foreman_ansible') */
  name: string;
  
  /** Plugin version for compatibility checking */
  version: string;
  
  /** Human-readable display name */
  displayName: string;
  
  /** Plugin description */
  description?: string;
  
  /** Author information */
  author?: string;
  
  /** Foreman version compatibility */
  foremanVersions?: string[];
  
  /** Plugin routes to register */
  routes?: PluginRoute[];
  
  /** Menu items to add */
  menuItems?: MenuItem[];
  
  /** Permissions to register */
  permissions?: PluginPermission[];
  
  /** Component extensions for existing pages */
  componentExtensions?: ComponentExtension[];
  
  /** Dashboard widgets */
  dashboardWidgets?: DashboardWidget[];
  
  /** API endpoints to register */
  apiEndpoints?: ApiEndpoint[];
  
  /** Internationalization configuration */
  i18n?: PluginI18nConfig;
  
  /** Plugin initialization function */
  initialize?: (context: PluginContext) => void | Promise<void>;
  
  /** Plugin cleanup function */
  destroy?: () => void | Promise<void>;
}

/**
 * Plugin internationalization configuration with Foreman gettext bridge
 */
export interface PluginI18nConfig {
  /** Translation domain (used for gettext integration, defaults to plugin name) */
  domain?: string;
  
  /** Default locale */
  defaultLocale: string;
  
  /** Supported locales */
  supportedLocales: string[];
  
  /** 
   * Translation keys and default values for development
   * These will be extracted to .po files for Foreman's translation workflow
   */
  keys: Record<string, string>;
  
  /** Optional: URL pattern for loading remote translations from Foreman */
  translationUrl?: string;
}

/**
 * Plugin route definition
 */
export interface PluginRoute extends Omit<RouteObject, 'element'> {
  /** Route component */
  element: ComponentType<PluginRouteProps>;
  
  /** Required permissions to access route */
  permissions?: string[];
  
  /** Route metadata */
  meta?: {
    title?: string;
    titleKey?: string; // i18n key for title
    breadcrumbs?: string[];
    breadcrumbKeys?: string[]; // i18n keys for breadcrumbs
    hideNavigation?: boolean;
  };
}

/**
 * Menu item definition
 */
export interface MenuItem {
  /** Unique menu item ID */
  id: string;
  
  /** Display label */
  label?: string;
  
  /** i18n key for label */
  labelKey?: string;
  
  /** Icon component or icon name */
  icon?: ComponentType | string;
  
  /** Route path */
  path?: string;
  
  /** External URL */
  url?: string;
  
  /** Parent menu ID for nested items */
  parent?: string;
  
  /** Menu position/order */
  order?: number;
  
  /** Required permissions */
  permissions?: string[];
  
  /** Submenu items */
  children?: MenuItem[];
}

/**
 * Plugin permission definition
 */
export interface PluginPermission {
  /** Permission name */
  name: string;
  
  /** Resource type this permission applies to */
  resource_type?: string;
  
  /** Available actions */
  actions?: string[];
  
  /** Human-readable description */
  description?: string;
  
  /** i18n key for description */
  descriptionKey?: string;
}

/**
 * Component extension points
 */
export interface ComponentExtension {
  /** Extension point name */
  extensionPoint: string;
  
  /** Component to render */
  component: ComponentType<ExtensionComponentProps>;
  
  /** Extension order/priority */
  order?: number;
  
  /** Required permissions */
  permissions?: string[];
  
  /** Conditional rendering function */
  condition?: (context: unknown) => boolean;
  
  /** Props to pass to component */
  props?: Record<string, unknown>;
  
  /** Extension title */
  title?: string;
  
  /** i18n key for title */
  titleKey?: string;
}

/**
 * Dashboard widget definition
 */
export interface DashboardWidget {
  /** Widget ID */
  id: string;
  
  /** Widget title */
  title?: string;
  
  /** i18n key for title */
  titleKey?: string;
  
  /** Widget component */
  component: ComponentType<DashboardWidgetProps>;
  
  /** Default size */
  size?: 'small' | 'medium' | 'large';
  
  /** Required permissions */
  permissions?: string[];
  
  /** Widget category */
  category?: string;
  
  /** i18n key for category */
  categoryKey?: string;
  
  /** Whether widget can be resized */
  resizable?: boolean;
  
  /** Default widget props */
  defaultProps?: Record<string, unknown>;
}

/**
 * API endpoint registration
 */
export interface ApiEndpoint {
  /** Endpoint name/identifier */
  name: string;
  
  /** Base URL path */
  basePath: string;
  
  /** API client class */
  clientClass: new (client: unknown) => unknown;
  
  /** OpenAPI spec URL for type generation */
  openApiSpec?: string;
}

/**
 * Plugin context provided during initialization
 */
export interface PluginContext {
  /** Foreman API client */
  apiClient: unknown; // TODO: Type this properly when API client types are available
  
  /** Current user */
  user: unknown; // TODO: Type this properly when User types are available
  
  /** Plugin registry for inter-plugin communication */
  pluginRegistry: PluginRegistry;
  
  /** Notification system */
  notifications: unknown; // TODO: Type this properly when notification types are available
  
  /** i18n functions */
  i18n: {
    /** Translation function for this plugin */
    t: (key: string, options?: Record<string, unknown>) => string;
    /** Change language */
    changeLanguage: (lng: string) => Promise<void>;
    /** Current language */
    language: string;
  };
  
  /** Navigation helpers */
  navigation: {
    navigate: (path: string) => void;
    addMenuItem: (item: MenuItem) => void;
    removeMenuItem: (id: string) => void;
  };
}

/**
 * Plugin registry interface
 */
export interface PluginRegistry {
  /** Register a plugin */
  register(plugin: ForemanPlugin): Promise<void>;
  
  /** Unregister a plugin */
  unregister(pluginName: string): Promise<void>;
  
  /** Get registered plugin */
  getPlugin(name: string): ForemanPlugin | undefined;
  
  /** Get all registered plugins */
  getAllPlugins(): ForemanPlugin[];
  
  /** Check if plugin is registered */
  isRegistered(name: string): boolean;
  
  /** Get plugins by capability */
  getPluginsWithRoutes(): ForemanPlugin[];
  getPluginsWithMenuItems(): ForemanPlugin[];
  getPluginsWithExtensions(extensionPoint: string): ComponentExtension[];
  getPluginsWithWidgets(): DashboardWidget[];
  
  /** i18n related methods */
  loadPluginTranslations(pluginName: string): Promise<void>;
  getPluginTranslationNamespace(pluginName: string): string;
}

/**
 * Plugin loading state
 */
export interface PluginLoadState {
  loading: boolean;
  loaded: string[];
  failed: Array<{ name: string; error: Error }>;
}

/**
 * Common extension point names
 */
export const EXTENSION_POINTS = {
  // Host detail page extensions
  HOST_DETAILS_TABS: 'host-details-tabs',
  HOST_DETAILS_ACTIONS: 'host-details-actions',
  HOST_DETAILS_INFO: 'host-details-info',
  
  // User profile extensions
  USER_PROFILE_TABS: 'user-profile-tabs',
  USER_PROFILE_ACTIONS: 'user-profile-actions',
  
  // Dashboard extensions
  DASHBOARD_WIDGETS: 'dashboard-widgets',
  DASHBOARD_SIDEBAR: 'dashboard-sidebar',
  
  // Navigation extensions
  MAIN_NAVIGATION: 'main-navigation',
  USER_MENU: 'user-menu',
  
  // Table extensions
  HOST_TABLE_COLUMNS: 'host-table-columns',
  HOST_TABLE_ACTIONS: 'host-table-actions',
  
  // Form extensions
  HOST_FORM_FIELDS: 'host-form-fields',
  USER_FORM_FIELDS: 'user-form-fields',
} as const;

export type ExtensionPointName = typeof EXTENSION_POINTS[keyof typeof EXTENSION_POINTS];