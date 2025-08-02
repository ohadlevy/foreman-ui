import i18next from 'i18next';
import { 
  ForemanPlugin, 
  PluginRegistry, 
  PluginLoadState, 
  ComponentExtension,
  DashboardWidget,
  PluginContext 
} from './types';

/**
 * Central plugin registry for managing Foreman plugins
 */
export class ForemanPluginRegistry implements PluginRegistry {
  private plugins = new Map<string, ForemanPlugin>();
  private loadState: PluginLoadState = {
    loading: false,
    loaded: [],
    failed: []
  };
  private changeListeners = new Set<() => void>();

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Notify all listeners of registry changes
   */
  private notifyListeners(): void {
    this.changeListeners.forEach(listener => listener());
  }

  /**
   * Register a plugin with the system
   */
  async register(plugin: ForemanPlugin): Promise<void> {
    try {
      // Validate plugin
      this.validatePlugin(plugin);
      
      // Store plugin first so we can access it during translation loading
      this.plugins.set(plugin.name, plugin);
      
      // Load translations if provided
      if (plugin.i18n) {
        await this.loadPluginTranslations(plugin.name);
      }
      
      // Initialize plugin if it has an initialization function
      if (plugin.initialize) {
        const context = this.createPluginContext(plugin);
        await plugin.initialize(context);
      }
      
      // Update load state
      this.loadState.loaded.push(plugin.name);
      
      // Notify listeners of registry change
      this.notifyListeners();
      
      console.log(`Plugin ${plugin.name} registered successfully`);
    } catch (error) {
      this.loadState.failed.push({ 
        name: plugin.name, 
        error: error as Error 
      });
      console.error(`Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`Plugin ${pluginName} not found for unregistration`);
      return;
    }

    try {
      // Call plugin destroy function if it exists
      if (plugin.destroy) {
        await plugin.destroy();
      }
      
      // Remove translations
      if (plugin.i18n) {
        const namespace = this.getPluginTranslationNamespace(pluginName);
        i18next.removeResourceBundle(i18next.language, namespace);
      }
      
      // Remove from registry
      this.plugins.delete(pluginName);
      
      // Update load state
      this.loadState.loaded = this.loadState.loaded.filter(name => name !== pluginName);
      this.loadState.failed = this.loadState.failed.filter(f => f.name !== pluginName);
      
      // Notify listeners of registry change
      this.notifyListeners();
      
      console.log(`Plugin ${pluginName} unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): ForemanPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): ForemanPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is registered
   */
  isRegistered(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugins that provide routes
   */
  getPluginsWithRoutes(): ForemanPlugin[] {
    return this.getAllPlugins().filter(plugin => 
      plugin.routes && plugin.routes.length > 0
    );
  }

  /**
   * Get plugins that provide menu items
   */
  getPluginsWithMenuItems(): ForemanPlugin[] {
    return this.getAllPlugins().filter(plugin => 
      plugin.menuItems && plugin.menuItems.length > 0
    );
  }

  /**
   * Get component extensions for a specific extension point
   */
  getPluginsWithExtensions(extensionPoint: string): ComponentExtension[] {
    const extensions: ComponentExtension[] = [];
    
    this.getAllPlugins().forEach(plugin => {
      if (plugin.componentExtensions) {
        plugin.componentExtensions
          .filter(ext => ext.extensionPoint === extensionPoint)
          .forEach(ext => extensions.push(ext));
      }
    });
    
    // Sort by order
    return extensions.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Get all dashboard widgets from plugins
   */
  getPluginsWithWidgets(): DashboardWidget[] {
    const widgets: DashboardWidget[] = [];
    
    this.getAllPlugins().forEach(plugin => {
      if (plugin.dashboardWidgets) {
        widgets.push(...plugin.dashboardWidgets);
      }
    });
    
    return widgets;
  }

  /**
   * Load plugin translations using Foreman gettext bridge
   */
  async loadPluginTranslations(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin?.i18n) {
      return;
    }

    const domain = plugin.i18n.domain || pluginName;
    
    try {
      // In development: use provided keys as fallback
      const devTranslations: Record<string, unknown> = {};
      Object.entries(plugin.i18n.keys).forEach(([key, defaultValue]) => {
        devTranslations[key] = defaultValue;
      });
      
      // Load from Foreman's translation system if available
      if (plugin.i18n.translationUrl) {
        // TODO: Fetch translations from Foreman API
        // For now, use development keys
      }
      
      // Register with i18next using domain as namespace
      i18next.addResourceBundle(
        plugin.i18n.defaultLocale, 
        domain, 
        devTranslations, 
        true, 
        true
      );
      
      console.log(`Loaded translations for plugin ${pluginName} (domain: ${domain})`);
    } catch (error) {
      console.error(`Failed to load translations for plugin ${pluginName}:`, error);
      
      // Fallback to development keys
      const fallbackTranslations: Record<string, unknown> = {};
      Object.entries(plugin.i18n.keys).forEach(([key, defaultValue]) => {
        fallbackTranslations[key] = defaultValue;
      });
      
      try {
        i18next.addResourceBundle(
          plugin.i18n.defaultLocale,
          domain,
          fallbackTranslations,
          true,
          true
        );
      } catch (fallbackError) {
        console.error(`Failed to load fallback translations for plugin ${pluginName}:`, fallbackError);
        // Continue anyway - translations are optional for plugin functionality
      }
    }
  }

  /**
   * Get plugin translation domain (namespace)
   */
  getPluginTranslationNamespace(pluginName: string): string {
    const plugin = this.plugins.get(pluginName);
    return plugin?.i18n?.domain || pluginName;
  }

  /**
   * Get plugin load state
   */
  getLoadState(): PluginLoadState {
    return { ...this.loadState };
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: ForemanPlugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }
    
    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }
    
    if (!plugin.displayName) {
      throw new Error('Plugin must have a displayName');
    }
    
    // Check for naming conflicts
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    
    // Validate routes
    if (plugin.routes) {
      plugin.routes.forEach((route, index) => {
        if (!route.path) {
          throw new Error(`Plugin ${plugin.name} route at index ${index} must have a path`);
        }
        if (!route.element) {
          throw new Error(`Plugin ${plugin.name} route at index ${index} must have an element`);
        }
      });
    }
    
    // Validate menu items
    if (plugin.menuItems) {
      plugin.menuItems.forEach((item, index) => {
        if (!item.id) {
          throw new Error(`Plugin ${plugin.name} menu item at index ${index} must have an id`);
        }
        if (!item.label && !item.labelKey) {
          throw new Error(`Plugin ${plugin.name} menu item at index ${index} must have either label or labelKey`);
        }
      });
    }
    
    // Validate i18n configuration
    if (plugin.i18n) {
      if (!plugin.i18n.defaultLocale) {
        throw new Error(`Plugin ${plugin.name} i18n config must have a defaultLocale`);
      }
      if (!plugin.i18n.supportedLocales || plugin.i18n.supportedLocales.length === 0) {
        throw new Error(`Plugin ${plugin.name} i18n config must have supportedLocales`);
      }
      if (!plugin.i18n.keys || Object.keys(plugin.i18n.keys).length === 0) {
        throw new Error(`Plugin ${plugin.name} i18n config must have translation keys`);
      }
    }
  }

  /**
   * Create plugin context for initialization
   */
  private createPluginContext(plugin: ForemanPlugin): PluginContext {
    return {
      // Optional dependencies - plugins should handle undefined gracefully
      apiClient: undefined,
      user: undefined,
      pluginRegistry: this,
      notifications: undefined,
      i18n: {
        t: (key: string, options?: Record<string, unknown>) => {
          const namespace = this.getPluginTranslationNamespace(plugin.name);
          return i18next.t(`${namespace}:${key}`, options);
        },
        changeLanguage: async (lng: string) => { await i18next.changeLanguage(lng); },
        language: i18next.language
      },
      navigation: {
        navigate: (path: string) => {
          // TODO: Implement navigation
          console.log(`Navigate to: ${path}`);
        },
        addMenuItem: (item) => {
          // TODO: Implement menu item addition
          console.log(`Add menu item:`, item);
        },
        removeMenuItem: (id: string) => {
          // TODO: Implement menu item removal
          console.log(`Remove menu item: ${id}`);
        }
      }
    };
  }
}

// Global plugin registry instance
export const pluginRegistry = new ForemanPluginRegistry();