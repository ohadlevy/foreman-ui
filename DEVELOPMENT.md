# Development Guide

This guide covers development workflows and best practices for the Foreman UI monorepo.

## Architecture Overview

```
foreman-ui/
├── packages/
│   ├── shared/          # Shared components, API clients, types
│   ├── user-portal/     # Self-service user interface
│   └── admin-portal/    # Full admin interface (future)
├── tools/               # Build and development tools
└── docs/                # Documentation
```

## Development Workflow

### Getting Started

1. **Clone and setup:**
   ```bash
   git clone https://github.com/ohadlevy/foreman-ui.git
   cd foreman-ui
   yarn install
   ```

2. **Start development:**
   ```bash
   # Start user portal
   yarn dev:user

   # Start all packages in parallel
   yarn dev
   ```

### Working with Packages

#### Shared Package
The shared package contains reusable components and utilities.

```bash
# Build shared package
yarn build:shared

# Run shared package tests
cd packages/shared && yarn test

# Start Storybook for component development
yarn storybook
```

#### User Portal
The user portal is a React app for end-users.

```bash
# Start development server
yarn dev:user

# Build for production
yarn build:user

# Run tests
cd packages/user-portal && yarn test
```

### API Integration

#### Generated Types
Generate TypeScript types from Foreman's OpenAPI spec:

```bash
# Start your Foreman instance, then:
cd packages/shared
yarn generate-types
```

This will fetch the OpenAPI spec from `http://localhost:3000/apidoc/v2.json` and generate types in `src/types/generated/api.ts`.

#### Testing API Integration

1. Start your Foreman development instance
2. Create a `.env.local` file in the user portal:
   ```
   REACT_APP_API_URL=http://localhost:3000/api/v2
   ```
3. Start the user portal: `yarn dev:user`

### Code Organization

#### Feature-Based Structure
Organize code by features, not by file types:

```
src/features/hosts/
├── components/
├── hooks/
├── types.ts
└── index.ts
```

#### Shared Components
Create reusable components in the shared package:

```
packages/shared/src/components/
├── forms/
├── tables/
├── layout/
└── feedback/
```

### State Management

#### Server State
Use React Query for server state management:

```typescript
// Good: Use provided hooks
const { data, isLoading } = useHosts();

// Avoid: Direct API calls in components
```

#### Client State
Use Zustand for client state:

```typescript
// Create focused stores
const useUIStore = create(() => ({
  theme: 'light',
  sidebar: true,
}));
```

### Testing

#### Unit Tests
Write unit tests for utilities and hooks:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with UI
yarn test:ui
```

#### Component Tests
Test components with React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { HostsList } from './HostsList';

test('renders hosts list', () => {
  render(<HostsList />);
  expect(screen.getByText('My Hosts')).toBeInTheDocument();
});
```

### Styling

#### PatternFly Components
Use PatternFly components for consistency:

```typescript
import { Button, Card, Title } from '@patternfly/react-core';
```

#### Custom Styles
Use CSS modules for custom styles:

```typescript
import styles from './Component.module.css';

<div className={styles.customClass}>
```

### Performance

#### Bundle Size
Monitor bundle sizes:

```bash
# Analyze bundle
yarn analyze

# Check shared package size
cd packages/shared && yarn build && ls -la dist/
```

#### Code Splitting
Use lazy loading for routes:

```typescript
const HostDetails = lazy(() => import('./pages/HostDetails'));
```

## Common Tasks

### Adding a New Page

1. Create the page component:
   ```typescript
   // packages/user-portal/src/pages/NewPage.tsx
   export const NewPage = () => <div>New Page</div>;
   ```

2. Add route:
   ```typescript
   // packages/user-portal/src/App.tsx
   <Route path="/new-page" element={<NewPage />} />
   ```

3. Add navigation link:
   ```typescript
   // packages/shared/src/components/Layout/UserLayout.tsx
   <NavItem to="/new-page">New Page</NavItem>
   ```

### Adding a New API Endpoint

1. Add to shared package:
   ```typescript
   // packages/shared/src/api/newResource.ts
   export class NewResourceAPI {
     constructor(private client: ForemanAPIClient) {}
     
     async list() {
       return this.client.get('/new-resources');
     }
   }
   ```

2. Create React hooks:
   ```typescript
   // packages/shared/src/hooks/useNewResource.ts
   export const useNewResources = () => {
     const { newResource } = useApi();
     return useQuery(['newResources'], () => newResource.list());
   };
   ```

3. Export from shared package:
   ```typescript
   // packages/shared/src/index.ts
   export * from './api/newResource';
   export * from './hooks/useNewResource';
   ```

### Debugging

#### Development Tools
- React Developer Tools
- React Query Devtools (included)
- Redux DevTools (if using Redux)

#### Common Issues

**Authentication not working:**
- Check API URL in `.env.local`
- Verify CORS settings on Foreman instance
- Check browser network tab for 401/403 errors

**Build failures:**
- Clear node_modules: `yarn clean && yarn install`
- Check TypeScript errors: `yarn build`
- Verify all dependencies are installed

**Hot reload not working:**
- Restart development server
- Check file watchers limit on Linux
- Verify network configuration for Docker

## Contributing

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and add tests
3. Run linting and tests: `yarn lint && yarn test`
4. Update documentation if needed
5. Submit pull request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep components focused and small
- Prefer composition over inheritance

### Commit Messages

Use conventional commits:
- `feat: add host creation form`
- `fix: resolve authentication timeout`
- `docs: update API integration guide`
- `refactor: simplify user profile component`