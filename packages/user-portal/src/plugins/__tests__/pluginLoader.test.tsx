/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PluginLoader } from '../pluginLoader';

// Mock the plugin registry
vi.mock('@foreman/shared', () => ({
  pluginRegistry: {
    register: vi.fn(),
    isRegistered: vi.fn(),
  },
  ForemanPlugin: {} // Type import
}));

// Get the mocked registry
const mockHooks = vi.mocked(await import('@foreman/shared'));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('PluginLoader', () => {
  let pluginLoader: PluginLoader;
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the singleton instance for testing
    (PluginLoader as unknown as { instance?: PluginLoader }).instance = undefined;
    
    pluginLoader = PluginLoader.getInstance();
    
    // Store original env var
    originalEnv = process.env.REACT_APP_ENABLED_PLUGINS;
    
    // Reset initialized state
    (pluginLoader as unknown as { initialized: boolean }).initialized = false;
    
    // Default mock behaviors
    ((mockHooks.pluginRegistry.isRegistered as any) as any).mockReturnValue(false);
    ((mockHooks.pluginRegistry.register as any) as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.REACT_APP_ENABLED_PLUGINS = originalEnv;
    } else {
      delete process.env.REACT_APP_ENABLED_PLUGINS;
    }
    
    // Clear console spies
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = PluginLoader.getInstance();
      const instance2 = PluginLoader.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create a new instance only once', () => {
      expect(PluginLoader.getInstance()).toBeInstanceOf(PluginLoader);
    });
  });

  describe('Plugin Discovery', () => {
    it('should discover default plugins when no environment variable is set', async () => {
      delete process.env.REACT_APP_ENABLED_PLUGINS;
      
      await pluginLoader.initialize();
      
      // Should register default demo plugins
      expect((mockHooks.pluginRegistry.register as any)).toHaveBeenCalledTimes(2);
      expect(consoleSpy.log).toHaveBeenCalledWith('🔌 Initializing plugin system...');
      expect(consoleSpy.log).toHaveBeenCalledWith('🎉 Plugin system initialization complete');
    });

    it('should discover plugins from environment variable', async () => {
      process.env.REACT_APP_ENABLED_PLUGINS = 'foreman_demo,custom_plugin';
      
      await pluginLoader.initialize();
      
      // Should attempt to register the demo plugin and warn about unknown custom_plugin
      expect((mockHooks.pluginRegistry.register as any)).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledWith('Unknown plugin: custom_plugin');
    });

    it('should handle empty environment variable', async () => {
      process.env.REACT_APP_ENABLED_PLUGINS = '';
      
      await pluginLoader.initialize();
      
      // Empty string means explicitly no plugins
      expect((mockHooks.pluginRegistry.register as any)).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('🔌 Initializing plugin system...');
      expect(consoleSpy.log).toHaveBeenCalledWith('🎉 Plugin system initialization complete');
    });

    it('should handle explicit default request', async () => {
      process.env.REACT_APP_ENABLED_PLUGINS = 'default';
      
      await pluginLoader.initialize();
      
      // "default" explicitly requests default plugins
      expect((mockHooks.pluginRegistry.register as any)).toHaveBeenCalledTimes(2);
      expect(consoleSpy.log).toHaveBeenCalledWith('🔌 Initializing plugin system...');
      expect(consoleSpy.log).toHaveBeenCalledWith('🎉 Plugin system initialization complete');
    });

    it('should trim plugin names from environment variable', async () => {
      process.env.REACT_APP_ENABLED_PLUGINS = ' foreman_demo , foreman_monitoring ';
      
      await pluginLoader.initialize();
      
      expect((mockHooks.pluginRegistry.register as any)).toHaveBeenCalledTimes(2);
    });
  });

  describe('Plugin Registration', () => {
    it('should register demo plugin successfully', async () => {
      await pluginLoader.initialize();
      
      const registerCalls = (mockHooks.pluginRegistry.register as any).mock.calls;
      expect(registerCalls.length).toBeGreaterThan(0);
      
      const demoPlugin = registerCalls.find((call: any) => call[0].name === 'foreman_demo')?.[0];
      expect(demoPlugin).toBeDefined();
      expect(demoPlugin.displayName).toBe('Demo Plugin');
      expect(demoPlugin.version).toBe('1.0.0');
      expect(demoPlugin.dashboardWidgets).toHaveLength(1);
      expect(demoPlugin.menuItems).toHaveLength(1);
      expect(demoPlugin.routes).toHaveLength(1);
    });

    it('should register monitoring plugin successfully', async () => {
      await pluginLoader.initialize();
      
      const registerCalls = (mockHooks.pluginRegistry.register as any).mock.calls;
      const monitoringPlugin = registerCalls.find((call: any) => call[0].name === 'foreman_monitoring')?.[0];
      
      expect(monitoringPlugin).toBeDefined();
      expect(monitoringPlugin.displayName).toBe('Monitoring Plugin');
      expect(monitoringPlugin.dashboardWidgets).toHaveLength(1);
      expect(monitoringPlugin.dashboardWidgets[0].id).toBe('status-widget');
    });

    it('should skip registration if plugin is already registered', async () => {
      (mockHooks.pluginRegistry.isRegistered as any).mockReturnValue(true);
      
      await pluginLoader.initialize();
      
      expect((mockHooks.pluginRegistry.register as any)).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('already registered, skipping'));
    });

    it('should handle plugin registration errors gracefully', async () => {
      const registrationError = new Error('Registration failed');
      (mockHooks.pluginRegistry.register as any).mockRejectedValue(registrationError);
      
      await pluginLoader.initialize();
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load plugin'),
        registrationError
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('🎉 Plugin system initialization complete');
    });
  });

  describe('Plugin Creation', () => {
    it('should create demo plugin with correct structure', async () => {
      await pluginLoader.initialize();
      
      const demoPluginCall = (mockHooks.pluginRegistry.register as any).mock.calls.find((call: any) => call[0].name === 'foreman_demo');
      const demoPlugin = demoPluginCall?.[0];
      
      expect(demoPlugin).toMatchObject({
        name: 'foreman_demo',
        version: '1.0.0',
        displayName: 'Demo Plugin',
        description: 'Demonstrates the plugin framework capabilities',
        author: 'Foreman Team',
        foremanVersions: ['>=3.0.0']
      });
      
      expect(demoPlugin.dashboardWidgets).toHaveLength(1);
      expect(demoPlugin.dashboardWidgets[0]).toMatchObject({
        id: 'demo-widget',
        title: 'Demo Widget',
        size: 'medium'
      });
      
      expect(demoPlugin.menuItems).toHaveLength(1);
      expect(demoPlugin.menuItems[0]).toMatchObject({
        id: 'demo-menu',
        label: 'Demo Plugin',
        path: '/demo',
        order: 100
      });
      
      expect(demoPlugin.routes).toHaveLength(1);
      expect(demoPlugin.routes[0].path).toBe('/demo');
      
      expect(demoPlugin.i18n).toMatchObject({
        domain: 'foreman_demo',
        defaultLocale: 'en',
        supportedLocales: ['en']
      });
    });

    it('should create monitoring plugin with correct structure', async () => {
      await pluginLoader.initialize();
      
      const monitoringPluginCall = (mockHooks.pluginRegistry.register as any).mock.calls.find((call: any) => call[0].name === 'foreman_monitoring');
      const monitoringPlugin = monitoringPluginCall?.[0];
      
      expect(monitoringPlugin).toMatchObject({
        name: 'foreman_monitoring',
        version: '1.0.0',
        displayName: 'Monitoring Plugin',
        description: 'System monitoring and status widgets',
        author: 'Foreman Team'
      });
      
      expect(monitoringPlugin.dashboardWidgets).toHaveLength(1);
      expect(monitoringPlugin.dashboardWidgets[0]).toMatchObject({
        id: 'status-widget',
        title: 'System Status',
        size: 'small'
      });
      
      // Monitoring plugin doesn't have menu items or routes
      expect(monitoringPlugin.menuItems).toBeUndefined();
      expect(monitoringPlugin.routes).toBeUndefined();
    });
  });

  describe('Component Rendering', () => {
    it('should create demo widget component that renders correctly', async () => {
      await pluginLoader.initialize();
      
      const demoPluginCall = (mockHooks.pluginRegistry.register as any).mock.calls.find((call: any) => call[0].name === 'foreman_demo');
      const demoPlugin = demoPluginCall?.[0];
      const DemoWidget = demoPlugin.dashboardWidgets[0].component;
      
      expect(DemoWidget).toBeDefined();
      expect(typeof DemoWidget).toBe('function');
    });

    it('should create demo route component that renders correctly', async () => {
      await pluginLoader.initialize();
      
      const demoPluginCall = (mockHooks.pluginRegistry.register as any).mock.calls.find((call: any) => call[0].name === 'foreman_demo');
      const demoPlugin = demoPluginCall?.[0];
      const RouteComponent = demoPlugin.routes[0].element;
      
      expect(RouteComponent).toBeDefined();
      expect(typeof RouteComponent).toBe('function');
    });

    it('should create monitoring widget component that renders correctly', async () => {
      await pluginLoader.initialize();
      
      const monitoringPluginCall = (mockHooks.pluginRegistry.register as any).mock.calls.find((call: any) => call[0].name === 'foreman_monitoring');
      const monitoringPlugin = monitoringPluginCall?.[0];
      const StatusWidget = monitoringPlugin.dashboardWidgets[0].component;
      
      expect(StatusWidget).toBeDefined();
      expect(typeof StatusWidget).toBe('function');
    });
  });

  describe('Initialization State', () => {
    it('should not initialize twice', async () => {
      await pluginLoader.initialize();
      await pluginLoader.initialize();
      
      // Should only log initialization messages once
      expect(consoleSpy.log).toHaveBeenCalledWith('🔌 Initializing plugin system...');
      expect(consoleSpy.log).toHaveBeenCalledTimes(4); // init + 2 plugins loaded + complete
    });

    it('should handle initialization errors', async () => {
      // Mock a critical error during initialization
      (mockHooks.pluginRegistry.register as any).mockImplementation(() => {
        throw new Error('Critical system error');
      });
      
      await pluginLoader.initialize();
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load plugin'),
        expect.any(Error)
      );
    });
  });

  describe('Unknown Plugins', () => {
    it('should warn about unknown plugins and continue with known ones', async () => {
      process.env.REACT_APP_ENABLED_PLUGINS = 'foreman_demo,unknown_plugin,foreman_monitoring';
      
      await pluginLoader.initialize();
      
      expect(consoleSpy.warn).toHaveBeenCalledWith('Unknown plugin: unknown_plugin');
      expect((mockHooks.pluginRegistry.register as any)).toHaveBeenCalledTimes(2); // Only known plugins
    });

    it('should handle all unknown plugins gracefully', async () => {
      process.env.REACT_APP_ENABLED_PLUGINS = 'unknown1,unknown2';
      
      await pluginLoader.initialize();
      
      expect(consoleSpy.warn).toHaveBeenCalledWith('Unknown plugin: unknown1');
      expect(consoleSpy.warn).toHaveBeenCalledWith('Unknown plugin: unknown2');
      expect((mockHooks.pluginRegistry.register as any)).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('🎉 Plugin system initialization complete');
    });
  });
});