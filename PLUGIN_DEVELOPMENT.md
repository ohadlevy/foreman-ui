# Plugin Development Guide

This guide covers how to develop plugins for the Foreman UI framework.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Plugin Structure](#plugin-structure)
- [Extension Points](#extension-points)
- [Development Workflow](#development-workflow)
- [Testing Plugins](#testing-plugins)
- [Internationalization](#internationalization)
- [Best Practices](#best-practices)
- [Deployment](#deployment)

## Overview

The Foreman UI plugin framework allows you to extend the user interface with:
- **Custom Routes**: Add new pages and navigation
- **Dashboard Widgets**: Display custom data and metrics
- **Menu Items**: Extend the main navigation
- **Extension Points**: Hook into existing pages (future)
- **Component Extensions**: Extend existing UI components (future)

Plugins are TypeScript/React modules that register themselves with the plugin registry and provide React components for various extension points.

## Quick Start

### 1. Create a New Plugin

```bash
# Copy the example plugin as a starting point
cp -r packages/plugins/example-plugin packages/plugins/my-plugin

# Update package.json
cd packages/plugins/my-plugin
```

### 2. Basic Plugin Structure

```typescript
// src/index.ts
import { ForemanPlugin } from '@foreman/shared';
import { MyDashboardWidget } from './components/MyDashboardWidget';
import { MySettingsPage } from './components/MySettingsPage';

export const plugin: ForemanPlugin = {
  name: 'foreman_my_plugin',
  version: '1.0.0',
  displayName: 'My Awesome Plugin',
  description: 'Adds awesome functionality to Foreman',
  author: 'Your Name',
  
  // Dashboard widgets
  dashboardWidgets: [
    {
      id: 'my-widget',
      title: 'My Widget',
      component: MyDashboardWidget,
      size: 'medium'
    }
  ],
  
  // Navigation menu items
  menuItems: [
    {
      id: 'my-menu',
      label: 'My Plugin',
      path: '/my-plugin',
      order: 200
    }
  ],
  
  // Custom routes/pages
  routes: [
    {
      path: '/my-plugin',
      element: MySettingsPage
    }
  ],
  
  // Internationalization
  i18n: {
    domain: 'foreman_my_plugin',
    defaultLocale: 'en',
    supportedLocales: ['en'],
    keys: {
      'menu.my_plugin': 'My Plugin',
      'widgets.my_widget': 'My Widget'
    }
  }
};
```

### 3. Register Your Plugin

```typescript
// In your plugin entry point
import { pluginRegistry } from '@foreman/shared';
import { plugin } from './index';

pluginRegistry.register(plugin);
```

## Plugin Structure

### Recommended Directory Structure

```
packages/plugins/my-plugin/
├── src/
│   ├── components/          # React components
│   │   ├── MyDashboardWidget.tsx
│   │   └── MySettingsPage.tsx
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── i18n/               # Translation keys
│   │   └── keys.ts
│   └── index.ts            # Plugin definition
├── locale/                 # Translation files
│   ├── en.json
│   └── foreman_my_plugin.pot
├── __tests__/              # Tests
├── package.json
├── tsconfig.json
└── README.md
```

### Core Files

#### `src/index.ts` - Plugin Definition
The main plugin configuration that exports a `ForemanPlugin` object.

#### `package.json` - Package Configuration
```json
{
  "name": "foreman-my-plugin",
  "version": "1.0.0",
  "description": "My awesome Foreman plugin",
  "main": "src/index.ts",
  "dependencies": {
    "@foreman/shared": "workspace:*",
    "react": "^18.2.0"
  }
}
```

#### `tsconfig.json` - TypeScript Configuration
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Extension Points

### Dashboard Widgets

Dashboard widgets appear on the main dashboard and display custom information.

```typescript
interface DashboardWidget {
  id: string;
  title?: string;
  component: ComponentType<DashboardWidgetProps>;
  size?: 'small' | 'medium' | 'large';
  permissions?: string[];
  category?: string;
  resizable?: boolean;
  defaultProps?: Record<string, unknown>;
}
```

**Example Widget:**
```typescript
import React from 'react';
import { Card, CardTitle, CardBody } from '@patternfly/react-core';
import { DashboardWidgetProps } from '@foreman/shared';

export const MyDashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  title = 'My Widget',
  size = 'medium' 
}) => {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardBody>
        <p>Widget content goes here</p>
      </CardBody>
    </Card>
  );
};
```

### Menu Items

Add items to the main navigation menu.

```typescript
interface MenuItem {
  id: string;
  label?: string;
  labelKey?: string;  // i18n key
  icon?: ComponentType | string;
  path?: string;
  url?: string;       // External URL
  parent?: string;    // Parent menu ID for nesting
  order?: number;     // Sort order
  permissions?: string[];
  children?: MenuItem[];
}
```

### Custom Routes

Add new pages to the application.

```typescript
interface PluginRoute {
  path: string;
  element: ComponentType<PluginRouteProps>;
  permissions?: string[];
  meta?: {
    title?: string;
    titleKey?: string;
    breadcrumbs?: string[];
    hideNavigation?: boolean;
  };
}
```

**Example Route Component:**
```typescript
import React from 'react';
import { Page, PageSection, Title } from '@patternfly/react-core';
import { PluginRouteProps } from '@foreman/shared';

export const MySettingsPage: React.FC<PluginRouteProps> = ({ 
  pluginName,
  pluginDisplayName 
}) => {
  return (
    <Page>
      <PageSection>
        <Title headingLevel="h1">
          {pluginDisplayName} Settings
        </Title>
        <p>Plugin: {pluginName}</p>
        {/* Your page content */}
      </PageSection>
    </Page>
  );
};
```

## Development Workflow

### 1. Local Development Setup

```bash
# Install dependencies
yarn install

# Start the development server
yarn dev

# Run in another terminal for the specific plugin
cd packages/plugins/my-plugin
yarn dev
```

### 2. Plugin Registration

Plugins can be registered in several ways:

#### During Development (Static Registration)
```typescript
// In your plugin's entry point
import { pluginRegistry } from '@foreman/shared';
import { plugin } from './index';

// Register immediately
pluginRegistry.register(plugin);
```

#### Environment-Based Loading
```bash
# Set environment variable to load specific plugins
REACT_APP_ENABLED_PLUGINS=foreman_demo,foreman_my_plugin yarn dev
```

#### Plugin Loader Integration
The `PluginLoader` class handles discovery and registration:

```typescript
// packages/user-portal/src/plugins/pluginLoader.tsx
// Add your plugin to the discovery logic
```

### 3. Hot Reloading

The development server supports hot reloading for plugin changes. When you modify plugin code, the changes will be reflected immediately in the browser.

## Testing Plugins

### Unit Testing Components

```typescript
// __tests__/MyDashboardWidget.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyDashboardWidget } from '../src/components/MyDashboardWidget';

describe('MyDashboardWidget', () => {
  it('should render widget title', () => {
    render(<MyDashboardWidget title="Test Widget" />);
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });
});
```

### Testing Plugin Registration

```typescript
// __tests__/plugin.test.ts
import { pluginRegistry } from '@foreman/shared';
import { plugin } from '../src/index';

describe('My Plugin', () => {
  beforeEach(() => {
    // Clear registry before each test
    pluginRegistry.clear();
  });

  it('should register successfully', async () => {
    await pluginRegistry.register(plugin);
    expect(pluginRegistry.isRegistered(plugin.name)).toBe(true);
  });

  it('should provide dashboard widgets', () => {
    expect(plugin.dashboardWidgets).toHaveLength(1);
    expect(plugin.dashboardWidgets[0].id).toBe('my-widget');
  });
});
```

### Integration Testing

```typescript
// __tests__/integration.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { PluginRouter } from '@foreman/shared';

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/my-plugin']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Plugin Integration', () => {
  it('should render plugin route', () => {
    render(<PluginRouter />, { wrapper: createTestWrapper() });
    expect(screen.getByText(/My Plugin Settings/)).toBeInTheDocument();
  });
});
```

## Internationalization

### 1. Define Translation Keys

```typescript
// src/i18n/keys.ts
export const translationKeys = {
  'menu.my_plugin': 'My Plugin',
  'widgets.my_widget': 'My Widget',
  'pages.settings.title': 'Plugin Settings',
  'messages.success': 'Operation completed successfully',
  'errors.load_failed': 'Failed to load data'
};
```

### 2. Configure Plugin i18n

```typescript
// In your plugin definition
i18n: {
  domain: 'foreman_my_plugin',
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr'],
  keys: translationKeys
}
```

### 3. Use Translations in Components

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

export const MyComponent: React.FC = () => {
  const { t } = useTranslation('foreman_my_plugin');
  
  return (
    <div>
      <h1>{t('pages.settings.title')}</h1>
      <p>{t('messages.success')}</p>
    </div>
  );
};
```

### 4. Extract Translations

```bash
# Extract translation keys to .pot file
yarn extract-translations

# This generates locale/foreman_my_plugin.pot
```

## Best Practices

### 1. Component Design

- **Use PatternFly Components**: Leverage the existing design system
- **Follow React Best Practices**: Use hooks, functional components
- **Handle Loading States**: Show spinners/skeletons while loading
- **Error Boundaries**: Implement error handling
- **Accessibility**: Follow WCAG guidelines

### 2. Performance

- **Lazy Loading**: Use `React.lazy()` for large components
- **Memoization**: Use `React.memo()` and `useMemo()` appropriately
- **Bundle Size**: Keep dependencies minimal
- **Code Splitting**: Split large plugins into chunks

### 3. State Management

- **Use Shared State**: Leverage existing auth/notification stores
- **React Query**: Use for server state management
- **Zustand**: Use for client state if needed
- **Props vs Context**: Prefer props for component data

### 4. Security

- **Permission Checks**: Always validate user permissions
- **Input Validation**: Sanitize user inputs
- **API Security**: Use existing authentication mechanisms
- **XSS Prevention**: Escape user content

### 5. Code Organization

- **Feature-Based Structure**: Group related code together
- **Shared Utilities**: Extract common functionality
- **Type Safety**: Use TypeScript throughout
- **Consistent Naming**: Follow existing conventions

## Deployment

### Current Implementation (Build-time)

The current plugin system loads plugins at build time, which means:
- Plugins must be included in the main repository
- Changes require rebuilding the entire application  
- Plugin distribution is tied to application releases

### Future Implementation (Runtime Loading) - TODO

**🚧 Future Work**: The plugin architecture is designed to support runtime plugin loading from external sources, which would enable:

- **NPM Package Loading**: Load plugins directly from npm registry
- **Remote URL Loading**: Fetch plugins from CDN or remote servers
- **Admin Management**: Enable/disable plugins through admin interface
- **Hot Loading**: Add plugins without application restart
- **Better Distribution**: Plugin authors can distribute independently

This approach would align better with how modern plugin ecosystems work (like WordPress, VS Code, etc.) where plugins are distributed separately from the core application.

**Implementation Plan**:
1. Extend Foreman API to serve plugin manifests and metadata
2. Add plugin discovery service that checks for available plugins
3. Implement dynamic module loading with proper sandboxing
4. Add admin UI for plugin management
5. Create plugin marketplace/registry integration

### Current Deployment Options

#### 1. Build Process

```bash
# Build the plugin for production
yarn build

# This generates optimized code in dist/
```

#### 2. Plugin Distribution (Current)

Plugins are currently distributed as:
- **Monorepo Packages**: Included in packages/plugins/
- **Source Code**: Built with main application

#### 3. Plugin Loading (Current)

```typescript
// Current: Static registration during build
import { pluginRegistry } from '@foreman/shared';
import { plugin } from './my-plugin';

pluginRegistry.register(plugin);
```

#### 4. Environment Configuration

```bash
# Current environment variables
REACT_APP_ENABLED_PLUGINS=foreman_monitoring,foreman_stats
```

### Future Deployment Options (Planned)

#### 1. NPM Package Distribution

```json
// package.json for external plugin
{
  "name": "foreman-my-plugin",
  "version": "1.0.0",
  "keywords": ["foreman-plugin"],
  "main": "dist/index.js",
  "peerDependencies": {
    "@foreman/shared": "^1.0.0"
  }
}
```

#### 2. Dynamic Plugin Loading

```typescript
// Future: Runtime loading
const loadExternalPlugin = async (packageName: string) => {
  const module = await import(packageName);
  await pluginRegistry.register(module.plugin);
};

// Load from npm
await loadExternalPlugin('foreman-my-plugin');

// Load from URL
await loadPlugin('https://cdn.example.com/plugins/my-plugin.js');
```

#### 3. Plugin Management API

```typescript
// Future: Admin management
const pluginManager = {
  async listAvailable(): Promise<PluginManifest[]> {
    return fetch('/api/plugins/available');
  },
  
  async install(pluginId: string): Promise<void> {
    return fetch(`/api/plugins/${pluginId}/install`, { method: 'POST' });
  },
  
  async enable(pluginId: string): Promise<void> {
    return fetch(`/api/plugins/${pluginId}/enable`, { method: 'POST' });
  }
};
```

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Check console for registration errors
   - Verify plugin is in enabled plugins list
   - Check plugin validation errors

2. **Components Not Rendering**
   - Verify component exports are correct
   - Check for TypeScript errors
   - Ensure props match expected interfaces

3. **Permissions Not Working**
   - Verify user has required permissions
   - Check permission string formatting
   - Test with different user roles

4. **Translations Not Working**
   - Verify i18n configuration
   - Check translation key formatting
   - Ensure locale files are generated

### Debug Mode

```typescript
// Enable plugin debug logging
localStorage.setItem('foreman-plugin-debug', 'true');

// This will log detailed plugin registration info
```

## Next Steps

- Review the [Plugin API Reference](./PLUGIN_API.md) for detailed API documentation
- Check out [Plugin Testing Guide](./PLUGIN_TESTING.md) for comprehensive testing strategies
- Explore the example plugin in `packages/plugins/example-plugin/`
- Join the Foreman development community for support and contributions

---

For more information, see:
- [Plugin API Reference](./PLUGIN_API.md)
- [Plugin Testing Guide](./PLUGIN_TESTING.md)
- [Foreman Development Documentation](./DEVELOPMENT.md)