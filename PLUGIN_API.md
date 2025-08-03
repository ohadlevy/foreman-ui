# Foreman UI Plugin API Reference

This document provides a comprehensive reference for developing plugins for the Foreman UI using the plugin framework.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Plugin Structure](#plugin-structure)
- [Core Interfaces](#core-interfaces)
- [Plugin Registration](#plugin-registration)
- [Routes](#routes)
- [Menu Items](#menu-items)
- [Dashboard Widgets](#dashboard-widgets)
- [Extension Points](#extension-points)
- [Internationalization](#internationalization)
- [Permissions](#permissions)
- [API Integration](#api-integration)
- [Development Environment](#development-environment)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Foreman UI plugin framework enables developers to extend Foreman's user interface with custom functionality. Plugins can add:

- Custom routes and pages
- Dashboard widgets
- Menu items and navigation
- Extension points in existing pages
- Permissions and access control
- Internationalization support

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install @foreman/shared
   ```

2. **Create a basic plugin**:
   ```typescript
   import { ForemanPlugin } from '@foreman/shared';

   export const myPlugin: ForemanPlugin = {
     name: 'foreman_my_plugin',
     version: '1.0.0',
     displayName: 'My Plugin',
     description: 'A custom Foreman plugin',
     author: 'Your Name',
     
     routes: [
       {
         path: '/my-plugin',
         element: MyPluginPage,
         permissions: ['view_my_plugin']
       }
     ],
     
     menuItems: [
       {
         id: 'my-plugin-menu',
         label: 'My Plugin',
         path: '/my-plugin',
         order: 100
       }
     ]
   };
   ```

3. **Register the plugin**:
   ```typescript
   import { pluginRegistry } from '@foreman/shared';
   
   await pluginRegistry.register(myPlugin);
   ```

## Plugin Structure

### Core Plugin Interface

```typescript
interface ForemanPlugin {
  // Required fields
  name: string;                    // Unique identifier (e.g., 'foreman_ansible')
  version: string;                 // Semantic version
  displayName: string;             // Human-readable name
  
  // Optional metadata
  description?: string;            // Plugin description
  author?: string;                 // Author information
  foremanVersions?: string[];      // Compatible Foreman versions
  
  // Functionality
  routes?: PluginRoute[];          // Custom routes
  menuItems?: MenuItem[];          // Navigation menu items
  permissions?: PluginPermission[]; // Permission definitions
  componentExtensions?: ComponentExtension[]; // UI extensions
  dashboardWidgets?: DashboardWidget[];       // Dashboard widgets
  apiEndpoints?: ApiEndpoint[];    // API endpoint registrations
  
  // Lifecycle
  initialize?: (context: PluginContext) => void | Promise<void>;
  destroy?: () => void | Promise<void>;
  
  // Internationalization
  i18n?: PluginI18nConfig;
}
```

## Core Interfaces

### Plugin Context

The plugin context provides access to Foreman's core services:

```typescript
interface PluginContext {
  // Core services (may be undefined during initialization)
  apiClient?: PluginApiClient;     // Foreman API client
  user?: PluginUser;               // Current user information
  notifications?: PluginNotifications; // Notification system
  
  // Always available
  pluginRegistry: PluginRegistry;  // Plugin registry instance
  
  // Internationalization
  i18n: {
    t: (key: string, options?: Record<string, unknown>) => string;
    changeLanguage: (lng: string) => Promise<void>;
    language: string;
  };
  
  // Navigation
  navigation: {
    navigate: (path: string) => void;
    addMenuItem: (item: MenuItem) => void;
    removeMenuItem: (id: string) => void;
  };
}
```

## Plugin Registration

### Manual Registration

```typescript
import { pluginRegistry } from '@foreman/shared';

await pluginRegistry.register(myPlugin);
```

### Environment-based Registration

For development, use environment variables:

```bash
# Load specific plugins
REACT_APP_ENABLED_PLUGINS=foreman_ansible,foreman_monitoring

# Load default demo plugins
REACT_APP_ENABLED_PLUGINS=default

# Load no plugins
REACT_APP_ENABLED_PLUGINS=
```

### Plugin Lifecycle

```typescript
export const myPlugin: ForemanPlugin = {
  name: 'foreman_example',
  // ... other fields
  
  async initialize(context: PluginContext) {
    // Plugin initialization logic
    console.log('Plugin initializing...', context.user);
    
    // Access services (check for undefined!)
    if (context.apiClient) {
      const data = await context.apiClient.get('/my-endpoint');
    }
  },
  
  async destroy() {
    // Cleanup logic
    console.log('Plugin destroying...');
  }
};
```

## Routes

### Basic Route

```typescript
import { PluginRoute, PluginRouteProps } from '@foreman/shared';
import React from 'react';

const MyPage: React.FC<PluginRouteProps> = ({ pluginName, pluginDisplayName }) => (
  <div>
    <h1>Welcome to {pluginDisplayName}</h1>
    <p>Plugin: {pluginName}</p>
  </div>
);

const routes: PluginRoute[] = [
  {
    path: '/my-plugin',
    element: MyPage,
    permissions: ['view_my_plugin']
  }
];
```

### Route with Metadata

```typescript
const routes: PluginRoute[] = [
  {
    path: '/my-plugin/details/:id',
    element: DetailsPage,
    permissions: ['view_details'],
    meta: {
      title: 'Details',
      titleKey: 'details.title',
      breadcrumbs: ['Home', 'My Plugin', 'Details'],
      hideNavigation: false
    }
  }
];
```

## Menu Items

### Simple Menu Item

```typescript
const menuItems: MenuItem[] = [
  {
    id: 'my-plugin',
    label: 'My Plugin',
    path: '/my-plugin',
    order: 100,
    permissions: ['view_my_plugin']
  }
];
```

### Hierarchical Menu

```typescript
const menuItems: MenuItem[] = [
  {
    id: 'monitoring',
    label: 'Monitoring',
    order: 50
  },
  {
    id: 'system-status',
    label: 'System Status',
    path: '/monitoring/status',
    parent: 'monitoring',
    order: 10
  },
  {
    id: 'alerts',
    label: 'Alerts',
    path: '/monitoring/alerts',
    parent: 'monitoring',
    order: 20
  }
];
```

### Internationalized Menu

```typescript
const menuItems: MenuItem[] = [
  {
    id: 'my-plugin',
    labelKey: 'menu.my_plugin',  // Uses i18n key
    path: '/my-plugin',
    order: 100
  }
];
```

## Dashboard Widgets

### Basic Widget

```typescript
import { DashboardWidget, DashboardWidgetProps } from '@foreman/shared';
import React from 'react';

const StatusWidget: React.FC<DashboardWidgetProps> = ({ widgetId, title, size }) => (
  <div className={`widget widget-${size}`}>
    <h3>{title}</h3>
    <div>Widget content here</div>
  </div>
);

const dashboardWidgets: DashboardWidget[] = [
  {
    id: 'status-widget',
    title: 'System Status',
    component: StatusWidget,
    size: 'medium',
    permissions: ['view_status'],
    category: 'monitoring',
    resizable: true,
    defaultProps: {
      refreshInterval: 30000
    }
  }
];
```

### Widget with Data Fetching

```typescript
const DataWidget: React.FC<DashboardWidgetProps> = () => {
  const [data, setData] = React.useState(null);
  
  React.useEffect(() => {
    // Fetch widget data
    fetchWidgetData().then(setData);
  }, []);
  
  return (
    <div>
      {data ? <div>{JSON.stringify(data)}</div> : <div>Loading...</div>}
    </div>
  );
};
```

## Extension Points

Extension points allow plugins to inject components into existing Foreman pages.

### Available Extension Points

```typescript
const EXTENSION_POINTS = {
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
  USER_FORM_FIELDS: 'user-form-fields'
};
```

### Creating Extensions

```typescript
import { ComponentExtension, ExtensionComponentProps } from '@foreman/shared';

const MyHostTab: React.FC<ExtensionComponentProps> = ({ context, extensionPoint }) => {
  const hostContext = context as { hostId: string };
  
  return (
    <div>
      <h3>Custom Host Tab</h3>
      <p>Host ID: {hostContext.hostId}</p>
    </div>
  );
};

const componentExtensions: ComponentExtension[] = [
  {
    extensionPoint: 'host-details-tabs',
    component: MyHostTab,
    title: 'Custom Tab',
    order: 100,
    permissions: ['view_hosts'],
    condition: (context) => {
      // Only show for specific hosts
      const hostContext = context as { hostId: string };
      return hostContext.hostId !== 'localhost';
    }
  }
];
```

### Using Extensions in Your Plugin Pages

```typescript
import { ExtensionPointRenderer } from '@foreman/shared';

const MyPage: React.FC = () => (
  <div>
    <h1>My Page</h1>
    
    {/* Render extensions for a custom extension point */}
    <ExtensionPointRenderer 
      extensionPoint="my-custom-extension"
      context={{ customData: 'value' }}
      extensionProps={{ additionalProp: true }}
    />
  </div>
);
```

## Internationalization

### Basic i18n Configuration

```typescript
const i18n: PluginI18nConfig = {
  domain: 'foreman_my_plugin',  // Translation domain
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr'],
  keys: {
    'title': 'My Plugin',
    'description': 'A custom plugin for Foreman',
    'menu.main': 'Main Menu',
    'errors.not_found': 'Resource not found'
  }
};
```

### Using Translations in Components

```typescript
const MyComponent: React.FC<PluginRouteProps> = () => {
  const { t } = useTranslation('foreman_my_plugin');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('actions.save', { defaultValue: 'Save' })}</button>
    </div>
  );
};
```

### Translation Files

For production, translations should be extracted to `.po` files:

```po
# locales/en/foreman_my_plugin.po
msgid "title"
msgstr "My Plugin"

msgid "description"
msgstr "A custom plugin for Foreman"
```

## Permissions

### Defining Permissions

```typescript
const permissions: PluginPermission[] = [
  {
    name: 'view_my_plugin',
    resource_type: 'MyPlugin',
    actions: ['view'],
    description: 'View my plugin pages',
    descriptionKey: 'permissions.view_my_plugin'
  },
  {
    name: 'manage_my_plugin',
    resource_type: 'MyPlugin', 
    actions: ['create', 'edit', 'delete'],
    description: 'Manage my plugin resources'
  }
];
```

### Checking Permissions in Components

```typescript
import { useCurrentUserData } from '@foreman/shared';
import { hasPluginPermissions } from '@foreman/shared';

const MyComponent: React.FC = () => {
  const { data: user } = useCurrentUserData();
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];
  
  const canView = hasPluginPermissions(['view_my_plugin'], userPermissions);
  const canManage = hasPluginPermissions(['manage_my_plugin'], userPermissions);
  
  return (
    <div>
      {canView && <div>Content visible to viewers</div>}
      {canManage && <button>Manage</button>}
    </div>
  );
};
```

## API Integration

### Custom API Endpoints

```typescript
const apiEndpoints: ApiEndpoint[] = [
  {
    name: 'myPluginApi',
    basePath: '/api/my_plugin',
    clientClass: MyPluginApiClient,
    openApiSpec: '/api/my_plugin/docs'
  }
];

class MyPluginApiClient {
  constructor(private client: unknown) {}
  
  async getResources() {
    return this.client.get('/api/my_plugin/resources');
  }
}
```

### Using Foreman API

```typescript
const MyComponent: React.FC = () => {
  const [hosts, setHosts] = React.useState([]);
  
  React.useEffect(() => {
    // Use Foreman's existing API hooks
    const fetchHosts = async () => {
      try {
        const response = await fetch('/api/hosts');
        const data = await response.json();
        setHosts(data.results);
      } catch (error) {
        console.error('Failed to fetch hosts:', error);
      }
    };
    
    fetchHosts();
  }, []);
  
  return (
    <div>
      <h2>Hosts ({hosts.length})</h2>
      {/* Render hosts */}
    </div>
  );
};
```

## Development Environment

### Project Structure

```
my-foreman-plugin/
├── src/
│   ├── components/
│   │   ├── MyPage.tsx
│   │   └── StatusWidget.tsx
│   ├── hooks/
│   │   └── useMyData.ts
│   ├── types/
│   │   └── index.ts
│   └── plugin.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install @foreman/shared react react-dom @patternfly/react-core
   npm install -D typescript @types/react @types/react-dom
   ```

2. **Configure TypeScript** (`tsconfig.json`):
   ```json
   {
     "compilerOptions": {
       "target": "es2020",
       "lib": ["dom", "dom.iterable", "es6"],
       "allowJs": true,
       "skipLibCheck": true,
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true,
       "strict": true,
       "forceConsistentCasingInFileNames": true,
       "module": "esnext",
       "moduleResolution": "node",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx"
     },
     "include": ["src"]
   }
   ```

3. **Environment configuration**:
   ```bash
   # .env.development
   REACT_APP_ENABLED_PLUGINS=foreman_my_plugin
   ```

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import MyComponent from './MyComponent';

// Mock the shared library
vi.mock('@foreman/shared', () => ({
  useCurrentUserData: () => ({ data: { name: 'Test User' } }),
  hasPluginPermissions: () => true
}));

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

### Plugin Registration Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { pluginRegistry } from '@foreman/shared';
import myPlugin from './plugin';

describe('Plugin Registration', () => {
  it('should register successfully', async () => {
    const registerSpy = vi.spyOn(pluginRegistry, 'register');
    
    await pluginRegistry.register(myPlugin);
    
    expect(registerSpy).toHaveBeenCalledWith(myPlugin);
    expect(pluginRegistry.isRegistered(myPlugin.name)).toBe(true);
  });
});
```

## Best Practices

### 1. Plugin Naming
- Use the `foreman_` prefix: `foreman_my_plugin`
- Use underscores, not hyphens
- Keep names lowercase and descriptive

### 2. Component Design
- Use PatternFly components for consistency
- Follow React best practices
- Handle loading and error states
- Make components responsive

### 3. Error Handling
```typescript
const MyComponent: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Content</div>;
};
```

### 4. Performance
- Use React.memo for expensive components
- Implement lazy loading for large components
- Debounce user inputs
- Cache API responses when appropriate

### 5. Accessibility
- Use semantic HTML
- Provide ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### 6. Security
- Validate all user inputs
- Handle permissions properly
- Never expose sensitive data
- Use HTTPS for API calls

## Troubleshooting

### Common Issues

#### 1. Plugin Not Loading
```bash
# Check browser console for errors
# Verify plugin name matches exactly
# Check environment variables
echo $REACT_APP_ENABLED_PLUGINS
```

#### 2. Permission Errors
```typescript
// Debug permission checking
const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];
console.log('User permissions:', userPermissions);
console.log('Required permissions:', ['view_my_plugin']);
console.log('Has permission:', hasPluginPermissions(['view_my_plugin'], userPermissions));
```

#### 3. Translation Not Working
```typescript
// Check translation registration
const namespace = pluginRegistry.getPluginTranslationNamespace('foreman_my_plugin');
console.log('Translation namespace:', namespace);

// Verify i18n configuration
console.log('Plugin i18n config:', myPlugin.i18n);
```

#### 4. Component Not Rendering
```typescript
// Check extension point registration
const extensions = pluginRegistry.getPluginsWithExtensions('my-extension-point');
console.log('Registered extensions:', extensions);
```

### Debug Mode

Enable debug logging:
```typescript
const myPlugin: ForemanPlugin = {
  // ... other config
  initialize(context) {
    console.log('Plugin context:', context);
    console.log('Available services:', {
      apiClient: !!context.apiClient,
      user: !!context.user,
      notifications: !!context.notifications
    });
  }
};
```

### Support Resources

- **Documentation**: Check this API reference and plugin examples
- **Source Code**: Review the framework source in `packages/shared/src/plugins/`
- **Community**: Join Foreman community discussions
- **Issues**: Report bugs on the Foreman UI GitHub repository

---

## API Reference Summary

| Category | Key Interfaces | Description |
|----------|---------------|-------------|
| **Core** | `ForemanPlugin`, `PluginContext` | Plugin definition and runtime context |
| **UI Components** | `PluginRoute`, `MenuItem`, `DashboardWidget` | UI building blocks |
| **Extensions** | `ComponentExtension`, `ExtensionPointRenderer` | Extending existing pages |
| **Permissions** | `PluginPermission`, `hasPluginPermissions` | Access control |
| **i18n** | `PluginI18nConfig`, `useTranslation` | Internationalization |
| **Registry** | `PluginRegistry`, `pluginRegistry` | Plugin management |

For more examples and detailed guides, see the [Plugin Development Guide](PLUGIN_DEVELOPMENT.md) and [Testing Guide](PLUGIN_TESTING.md).