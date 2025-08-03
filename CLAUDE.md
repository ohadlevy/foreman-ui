# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Mission

This is a **modern React UI replacement** for Foreman's existing Ruby on Rails web interface. The project aims to:

1. **User Portal**: Create a simplified, cloud-like self-service experience for non-admin users
2. **Admin Portal**: Eventually replace the existing Foreman web UI with a modern, intuitive admin interface
3. **Plugin Architecture**: Support extensibility through a modern plugin system
4. **Improved UX**: Focus on ease of use, great onboarding, and modern UI patterns

### Context: Foreman Ecosystem
- **Current State**: Rails-based UI with jQuery, some React components, PatternFly v4/v5 migration
- **Plugin Ecosystem**: 50+ plugins extending functionality (Ansible, Puppet, Remote Execution, etc.)
- **User Base**: Infrastructure teams managing physical/virtual servers, provisioning, configuration management
- **Goal**: Complete frontend modernization while maintaining plugin compatibility

## Development Guidelines

### Code Development Workflow
- Always run lint/tsc/tests, if you change any file during that cycle, run it again
- Remove trailing whitespaces

## Architecture Overview

**Lerna Monorepo Structure:**
```
foreman-ui/
├── packages/
│   ├── shared/          # @foreman/shared - Component library, API clients, plugin framework
│   ├── user-portal/     # @foreman/user-portal - Self-service interface  
│   └── admin-portal/    # @foreman/admin-portal - Modern admin interface (planned)
```

**Technology Stack:**
- React 18 + TypeScript
- PatternFly v5 (Red Hat's design system - same as current Foreman)
- React Query + Zustand for state management
- Vite for build tooling with plugin support
- Vitest + React Testing Library
- Lerna for monorepo management

## Plugin Architecture Strategy

### Current Foreman Plugin System
Foreman plugins are Ruby gems that:
- Extend Rails engines with UI components
- Use webpack for frontend asset compilation
- Add menu items, permissions, and roles
- Integrate with existing PatternFly components
- Support React components alongside traditional Rails views

### New UI Plugin Framework (Design Goals)
The shared package should provide:
```typescript
// Plugin registration system
interface ForemanPlugin {
  name: string;
  version: string;
  routes: PluginRoute[];
  menuItems: MenuItem[];
  permissions: Permission[];
  components: ComponentRegistry;
}

// Example plugin integration
export const registerPlugin = (plugin: ForemanPlugin) => {
  // Register routes, components, permissions
};
```

### Plugin Categories to Support
1. **Infrastructure Plugins**: Ansible, Puppet, Remote Execution
2. **Cloud Providers**: AWS, Azure, OpenStack integrations  
3. **Monitoring/Security**: OpenSCAP, monitoring dashboards
4. **Provisioning**: Discovery, bootdisk, templates
5. **Authentication**: LDAP, SAML, OAuth integrations

## Development Commands

### Essential Commands
```bash
yarn install            # Install all dependencies
yarn dev:user           # Start user portal (port 3001)
yarn dev                # Start all packages in parallel
yarn build              # Build all packages
yarn test               # Run all tests
yarn lint               # Lint all packages
yarn lint:fix           # Fix linting issues
```

### Package-Specific Commands
```bash
# Shared package (component library + plugin framework)
yarn dev:shared         # Build in watch mode
yarn build:shared       # Build library
yarn storybook          # Component development environment

# API integration
yarn generate-types     # Generate TS types from Foreman OpenAPI spec

# Testing
yarn test:watch         # Tests in watch mode
yarn test:coverage      # Coverage reports
yarn test:ui            # Interactive test UI
```

## User Experience Philosophy

### User Portal Focus
- **Simplified workflows** for common tasks (host management, provisioning)
- **Cloud-like experience** - hide infrastructure complexity
- **Role-based interface** - only show what users need
- **Self-service capabilities** without admin intervention
- **Mobile-responsive** for field operations

### Admin Portal Goals (Future)
- **Feature parity** with current Foreman web UI
- **Modern, intuitive design** replacing current Rails interface
- **Improved onboarding** for new Foreman administrators
- **Better information architecture** and navigation
- **Plugin ecosystem** that's easier to develop and maintain

## State Management Architecture

### Server State (React Query)
Use provided hooks from `@foreman/shared`:
```typescript
const { data: hosts, isLoading } = useHosts();
const { data: user } = useCurrentUserData();
const { data: ansibleRoles } = useAnsibleRoles(); // Plugin-provided hook
```

### Client State (Zustand)
- **Authentication**: `useAuthStore` - login/logout, permissions, tokens
- **Notifications**: `useNotificationStore` - app-wide messages
- **Plugin State**: Plugin-specific stores for feature state
- **UI State**: Navigation, modal state, preferences

### API Integration
The `ForemanAPIClient` handles:
- Authentication (Basic auth + Personal Access Tokens)
- Automatic token management and 401 handling
- Development proxy configuration (`/api/v2` -> Foreman instance)
- Plugin API endpoint registration

## Component Design Principles

### Shared Components (`packages/shared/src/components/`)
Follow PatternFly design patterns:
```
components/
├── Layout/              # Navigation, page structure
├── Notifications/       # Toast messages, notification center
├── forms/              # Form components with validation
├── Branding/           # Foreman branding elements
├── Tables/             # Enhanced PatternFly table components
├── Dashboards/         # Dashboard widgets and layouts
└── Plugin/             # Plugin integration components
```

### System Status & Health Monitoring

The SystemStatus page (`/system-status`) provides users with:

**Health Metrics Dashboard:**
- **Overall System Health**: Weighted calculation of all system components
- **API Connection**: Status of Foreman API connectivity and response quality  
- **Authentication**: Always shows 100% (since page requires auth to access)
- **Extensions/Plugins**: Percentage of successfully loaded plugins

**Plugin Information:**
- List of installed extensions with status indicators
- Plugin metadata (version, author, description, features)
- Feature breakdown (dashboard widgets, menu items, routes)
- Error details for failed plugin loads

**System Information:**
- Foreman version (fetched from `/api/status` endpoint)
- Quick statistics (extension counts, working extensions)
- User-friendly explanations for non-technical users

**API Integration:**
```typescript
// Status API integration
const { data: status, isLoading, error } = useStatus();

// Displays version with loading/error states
{statusLoading ? 'Loading...' : statusError ? 'Unknown' : status?.version}
```

### Plugin Integration Points
```typescript
// Plugin component registration
interface PluginComponentProps {
  hostId?: string;
  user?: User;
  permissions?: Permission[];
}

// Example: Ansible plugin adds host configuration tab
const AnsibleHostTab: React.FC<PluginComponentProps> = ({ hostId }) => {
  const { data: roles } = useAnsibleRoles(hostId);
  return <AnsibleRoleSelector roles={roles} />;
};
```

## Authentication & Authorization

### Current Implementation
1. Support both username/password and Personal Access Token auth
2. Zustand store manages auth state with localStorage persistence
3. Automatic token refresh and logout on 401 responses
4. Permission checking: `useAuthStore().hasPermission(permission, resource?)`

### Plugin Permission Integration
```typescript
// Plugins can register permissions
interface PluginPermission {
  name: string;
  resource_type: string;
  actions: string[];
}

// Check plugin-specific permissions
const canExecuteAnsible = hasPermission('execute_ansible', 'Host');
```

## Testing Strategy

### Test Organization
```
src/feature/
├── Component.tsx
├── hooks.ts
├── types.ts
└── __tests__/
    ├── Component.test.tsx
    ├── hooks.test.ts
    ├── integration.test.tsx
    └── plugin-integration.test.tsx
```

### Plugin Testing
- Mock plugin API responses
- Test plugin component registration
- Verify permission integration
- Test plugin route handling

## API Integration Patterns

### Type Generation
```bash
yarn generate-types  # Generates from http://localhost:3000/apidoc/v2.json
```

### Plugin API Integration
```typescript
// Plugin APIs extend base client
export class AnsibleAPI {
  constructor(private client: ForemanAPIClient) {}
  
  async getHostRoles(hostId: string) {
    return this.client.get(`/ansible/hosts/${hostId}/roles`);
  }
}

// Plugin hook integration
export const useAnsibleRoles = (hostId: string) => {
  const { ansible } = useApi();
  return useQuery(['ansible', 'roles', hostId], () => 
    ansible.getHostRoles(hostId)
  );
};
```

## Plugin Development Framework

### Plugin Structure (Future)
```typescript
// packages/plugins/foreman-ansible/
export const ForemanAnsiblePlugin: ForemanPlugin = {
  name: 'foreman_ansible',
  version: '1.0.0',
  
  // Route registration
  routes: [
    {
      path: '/ansible/hosts/:id',
      component: AnsibleHostDetails,
      permissions: ['view_ansible']
    }
  ],
  
  // Menu integration
  menuItems: [
    {
      id: 'ansible_roles',
      label: 'Ansible Roles',
      path: '/ansible/roles',
      parent: 'infrastructure'
    }
  ],
  
  // Component extensions
  componentExtensions: {
    'host-details-tabs': [
      {
        component: AnsibleHostTab,
        label: 'Ansible',
        permissions: ['view_ansible']
      }
    ]
  }
};
```

### Plugin Delivery Mechanisms
1. **NPM Packages**: Plugins as installable npm packages
2. **Dynamic Loading**: Runtime plugin loading from CDN/registry
3. **Build-time Integration**: Compile plugins into main bundle
4. **Micro-frontends**: Independent plugin deployment

## Development Environment Setup

### Required Setup
1. **Foreman Instance**: Running on `http://localhost:3000` with plugins
2. **API Access**: Valid user credentials or Personal Access Token
3. **Plugin Development**: Access to plugin development instances
4. **Environment Variables**: 
   ```bash
   # packages/user-portal/.env.local
   REACT_APP_API_URL=http://localhost:3000/api/v2
   REACT_APP_ENABLE_PLUGINS=true
   ```

### Plugin Development Workflow
1. **Core Development**: Use Storybook for component development
2. **Integration Testing**: Test against real Foreman instance with plugins
3. **Plugin Registration**: Test plugin loading and integration
4. **Permission Testing**: Verify role-based access control

## Migration Strategy

### Phase 1: User Portal
- Self-service host management
- Basic provisioning workflows
- User profile management
- System status and health monitoring
- Core plugin integration (Ansible, Puppet basics)

### Phase 2: Admin Portal MVP
- Host management
- User/role administration
- Essential plugins (Ansible, Remote Execution)
- Settings management

### Phase 3: Full Feature Parity
- All current Foreman web UI features
- Complete plugin ecosystem support
- Advanced configuration management
- Reporting and monitoring

### Phase 4: Legacy Replacement
- Deprecate Rails UI
- Full plugin migration
- Performance optimization
- Enterprise features

## Current Foreman Context

### Existing UI Pain Points
- jQuery-based interactions with limited modern patterns
- Inconsistent PatternFly usage across components
- Plugin UI integration complexity
- Mobile responsiveness issues
- Complex navigation for new users

### Plugin Ecosystem Reality
- **50+ active plugins** extending Foreman functionality
- **JavaScript-heavy plugins**: Ansible (71%), Remote Execution (67%), Puppet (51%)
- **Ruby on Rails engines** with webpack asset compilation
- **Menu integration** through Rails plugin architecture
- **Permission system** tightly coupled with Rails authorization

This new UI must maintain **backward compatibility** with existing plugin concepts while providing a **modern development experience** for future plugins.

## Code Quality Requirements

### Essential Code Quality Checks
**All contributions must pass the following checks before being considered complete:**

1. **TypeScript Compilation**: All code must compile without TypeScript errors
   ```bash
   yarn build  # Must pass without TypeScript errors
   ```

2. **Linting**: All code must pass ESLint checks
   ```bash
   yarn lint   # Must pass without errors
   yarn lint:fix  # Use to auto-fix formatting issues
   ```

3. **Testing**: All tests must pass, including new tests for added functionality
   ```bash
   yarn test   # All tests must pass
   ```

### Code Quality Standards
- **Type Safety**: Use proper TypeScript types, avoid `any`
- **Test Coverage**: Write tests for new functionality, maintain existing test coverage
- **Component Testing**: React components must have corresponding test files
- **API Integration**: Mock API calls in tests, use proper error handling
- **Plugin Framework**: Plugin-related code must include comprehensive tests

### Pre-commit Requirements
Before committing any changes, ensure:
- [ ] `yarn lint` passes without errors
- [ ] `yarn test` passes all tests
- [ ] `yarn build` completes successfully
- [ ] New functionality includes appropriate tests
- [ ] TypeScript types are properly defined