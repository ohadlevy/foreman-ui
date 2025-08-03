import { pluginRegistry, ForemanPlugin } from '@foreman/shared';

/**
 * Plugin loader that discovers and registers plugins
 * In a real implementation, this would:
 * 1. Load plugin manifests from the server
 * 2. Dynamically import plugin modules
 * 3. Register plugins with the framework
 */
export class PluginLoader {
  private static instance: PluginLoader;
  private initialized = false;

  public static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  /**
   * Initialize the plugin system and load available plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔌 Initializing plugin system...');

    try {
      // In a real implementation, this would:
      // 1. Fetch plugin list from Foreman API
      // 2. Check which plugins are enabled
      // 3. Load plugin assets dynamically
      
      const availablePlugins = await this.discoverPlugins();
      
      for (const pluginInfo of availablePlugins) {
        try {
          const plugin = await this.loadPlugin(pluginInfo);
          if (plugin) {
            // Check if plugin is already registered before attempting registration
            if (!pluginRegistry.isRegistered(plugin.name)) {
              await pluginRegistry.register(plugin);
              console.log(`✅ Plugin '${plugin.name}' loaded successfully`);
            } else {
              console.log(`ℹ️ Plugin '${plugin.name}' already registered, skipping`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to load plugin '${pluginInfo.name}':`, error);
        }
      }

      this.initialized = true;
      console.log('🎉 Plugin system initialization complete');
      
    } catch (error) {
      console.error('❌ Plugin system initialization failed:', error);
    }
  }

  /**
   * Discover available plugins
   * In production, this would call the Foreman API
   */
  private async discoverPlugins(): Promise<PluginInfo[]> {
    // Simulate plugin discovery
    // In real implementation: GET /api/plugins or similar
    
    const enabledPlugins = this.getEnabledPluginsFromConfig();
    
    return enabledPlugins.map(name => ({
      name,
      version: '1.0.0',
      enabled: true,
      path: `/plugins/${name}` // Where to load the plugin from
    }));
  }

  /**
   * Load a specific plugin
   * In production, this would dynamically import the plugin module
   */
  private async loadPlugin(pluginInfo: PluginInfo): Promise<ForemanPlugin | null> {
    // For demo purposes, we'll create some sample plugins here
    // In production, this would be: import(pluginInfo.path)
    
    switch (pluginInfo.name) {
      case 'foreman_demo':
        return this.createDemoPlugin();
      case 'foreman_monitoring':
        return this.createMonitoringPlugin();
      default:
        console.warn(`Unknown plugin: ${pluginInfo.name}`);
        return null;
    }
  }

  /**
   * Get enabled plugins from configuration
   * 
   * SECURITY NOTE: In production, plugin authorization should come from Foreman API
   * (GET /api/plugins/enabled) rather than environment variables. The API response
   * should include only plugins that the current user is authorized to use.
   * 
   * Environment variable support is primarily for development and will be deprecated
   * once the Foreman API integration is complete.
   */
  private getEnabledPluginsFromConfig(): string[] {
    // TODO: Replace with Foreman API call: GET /api/plugins/enabled
    // The API should handle authorization and only return plugins the user can access
    
    // Development-only environment variable support
    const envPlugins = process.env.REACT_APP_ENABLED_PLUGINS;
    if (envPlugins) {
      // Special value to explicitly request default plugins
      if (envPlugins.trim() === 'default') {
        return ['foreman_demo', 'foreman_monitoring'];
      }
      
      const plugins = envPlugins.split(',').map(p => p.trim()).filter(p => p);
      // If after filtering we have no plugins, return empty array (no plugins)
      return plugins;
    }
    
    // Default demo plugins for development when no env var is set
    return ['foreman_demo', 'foreman_monitoring'];
  }

  /**
   * Create demo plugin (would normally be imported)
   */
  private createDemoPlugin(): ForemanPlugin {
    const DemoWidget = () => (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>🚀 Demo Plugin Widget</h3>
        <p>This widget was loaded by the plugin system!</p>
        <div style={{ fontSize: '1.2rem', color: '#06c' }}>Plugin framework is working!</div>
      </div>
    );

    return {
      name: 'foreman_demo',
      version: '1.0.0',
      displayName: 'Demo Plugin',
      description: 'Demonstrates the plugin framework capabilities',
      author: 'Foreman Team',
      foremanVersions: ['>=3.0.0'],
      
      dashboardWidgets: [
        {
          id: 'demo-widget',
          title: 'Demo Widget',
          component: DemoWidget,
          size: 'medium'
        }
      ],
      
      menuItems: [
        {
          id: 'demo-menu',
          label: 'Demo Plugin',
          path: '/demo',
          order: 100
        }
      ],
      
      routes: [
        {
          path: '/demo',
          element: () => (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h1>🎉 Demo Plugin Page</h1>
              <p>This entire page was added by a plugin!</p>
              <p>The plugin system dynamically loaded this route.</p>
            </div>
          )
        }
      ],
      
      i18n: {
        domain: 'foreman_demo',
        defaultLocale: 'en',
        supportedLocales: ['en'],
        keys: {
          'menu.demo': 'Demo Plugin',
          'widgets.demo': 'Demo Widget'
        }
      }
    };
  }

  /**
   * Create monitoring plugin (would normally be imported)
   */
  private createMonitoringPlugin(): ForemanPlugin {
    const StatusWidget = () => (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>📊 System Monitoring</h3>
        <div style={{ fontSize: '1.5rem', color: '#28a745', margin: '10px 0' }}>
          🟢 All Systems Operational
        </div>
        <p>This is another plugin widget!</p>
      </div>
    );

    return {
      name: 'foreman_monitoring',
      version: '1.0.0',
      displayName: 'Monitoring Plugin',
      description: 'System monitoring and status widgets',
      author: 'Foreman Team',
      foremanVersions: ['>=3.0.0'],
      
      dashboardWidgets: [
        {
          id: 'status-widget',
          title: 'System Status',
          component: StatusWidget,
          size: 'small'
        }
      ],
      
      i18n: {
        domain: 'foreman_monitoring',
        defaultLocale: 'en',
        supportedLocales: ['en'],
        keys: {
          'widgets.status': 'System Status'
        }
      }
    };
  }
}

interface PluginInfo {
  name: string;
  version: string;
  enabled: boolean;
  path: string;
}

// Export singleton instance
export const pluginLoader = PluginLoader.getInstance();