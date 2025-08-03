import { ForemanPlugin, EXTENSION_POINTS } from '@foreman/shared';
import { ExampleDashboardPage } from './pages/ExampleDashboardPage';
import { ExampleHostTab } from './components/ExampleHostTab';
import { ExampleDashboardWidget } from './components/ExampleDashboardWidget';
import { translationKeys } from './i18n/keys';

/**
 * Example plugin demonstrating Foreman UI plugin development patterns
 */
export const ExamplePlugin: ForemanPlugin = {
  name: 'foreman_example',
  version: '1.0.0',
  displayName: 'Example Plugin',
  description: 'A reference implementation showing how to create Foreman UI plugins',
  author: 'Foreman Team',
  foremanVersions: ['>=3.0.0'],

  // Routes provided by this plugin
  routes: [
    {
      path: '/example/dashboard',
      element: ExampleDashboardPage,
      meta: {
        titleKey: 'pages.dashboard.title',
        breadcrumbKeys: ['breadcrumbs.dashboard']
      },
      permissions: ['view_example_dashboard']
    }
  ],

  // Menu items to add to navigation
  menuItems: [
    {
      id: 'example-menu',
      labelKey: 'menu.main',
      path: '/example/dashboard',
      order: 100,
      permissions: ['view_example_dashboard']
    }
  ],

  // Permissions this plugin requires
  permissions: [
    {
      name: 'view_example_dashboard',
      resource_type: 'ExamplePlugin',
      actions: ['view'],
      descriptionKey: 'permissions.view_dashboard'
    },
    {
      name: 'manage_example_features',
      resource_type: 'ExamplePlugin', 
      actions: ['create', 'edit', 'destroy'],
      descriptionKey: 'permissions.manage_features'
    }
  ],

  // Component extensions - add tabs/widgets to existing pages
  componentExtensions: [
    {
      extensionPoint: EXTENSION_POINTS.HOST_DETAILS_TABS,
      component: ExampleHostTab,
      titleKey: 'host.tab_title',
      order: 10,
      permissions: ['view_hosts']
    }
  ],

  // Dashboard widgets
  dashboardWidgets: [
    {
      id: 'example-widget',
      titleKey: 'widgets.summary.title',
      component: ExampleDashboardWidget,
      size: 'medium',
      categoryKey: 'widgets.category',
      permissions: ['view_example_dashboard']
    }
  ],

  // Internationalization with Foreman gettext bridge
  i18n: {
    domain: 'foreman_example', // gettext domain
    defaultLocale: 'en',
    supportedLocales: ['en', 'es', 'fr', 'de', 'ja', 'pt_BR'],
    keys: translationKeys
  },

  // Plugin initialization
  initialize: async (context) => {
    console.log('Example plugin initializing...');
    console.log('Current user:', context.user);
    console.log('Available API client:', !!context.apiClient);
    
    // Example: Register custom API endpoints, set up event listeners, etc.
    
    console.log('Example plugin initialized successfully');
  },

  // Plugin cleanup
  destroy: async () => {
    console.log('Example plugin cleaning up...');
    // Example: Remove event listeners, clear caches, etc.
  }
};

export default ExamplePlugin;