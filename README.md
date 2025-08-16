# Foreman React UI

A modern React-based user interface for [Foreman](https://theforeman.org/), built as a monorepo with separate admin and user portals.

## 🚧 Early Development

This project is in active early development. Expect breaking changes and incomplete features.

## Architecture

This project consists of main packages:

- **@foreman/shared** - Shared components, API clients, hooks, and utilities
- **@foreman/user-portal** - Self-service portal for end users ✅
- **@foreman/admin-portal** - Full-featured admin interface (planned)

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn 1.22+
- Access to a Foreman instance with API v2

### Installation

#### Option 1: Container Deployment (Recommended)
```bash
git clone https://github.com/ohadlevy/foreman-ui.git
cd foreman-ui

# Edit compose.yml to set your FOREMAN_URL, then:
podman compose up
```

Access the UI at https://localhost:8443

**📦 For complete container setup guide, see [CONTAINER.md](./CONTAINER.md)**

#### Option 2: Automated Development Setup
```bash
git clone https://github.com/ohadlevy/foreman-ui.git
cd foreman-ui
./setup.sh
```

#### Option 3: Manual Development Setup
```bash
git clone https://github.com/ohadlevy/foreman-ui.git
cd foreman-ui
yarn install
yarn build:shared  # Required before starting user portal
```

**📖 For detailed development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

### Development

```bash
# Start user portal in development mode
yarn dev:user

# Start all packages in development mode
yarn dev

# Build all packages
yarn build

# Run tests
yarn test

# Run linting
yarn lint
```

## Current Status

✅ **User Portal**: Functional with authentication, host management, profile
✅ **Shared Library**: API clients, components, hooks, auth system
⚠️ **Admin Portal**: Planned for future release

### Environment Configuration

Create `.env.local` files in each portal package:

```bash
# packages/user-portal/.env.local
REACT_APP_API_URL=http://localhost:3000/api/v2
REACT_APP_GRAPHQL_URL=http://localhost:3000/graphql
```

## Package Structure

```
foreman-ui/
├── packages/
│   ├── shared/           # Shared library
│   ├── user-portal/      # User self-service portal
│   └── admin-portal/     # Admin interface (future)
├── tools/                # Build and development tools
└── docs/                 # Documentation
```

## Technology Stack

- **React 18** with TypeScript
- **PatternFly v6** for UI components
- **React Query + Zustand** for state management
- **React Router v6** for routing
- **Vite** for build tooling
- **Vitest** for testing

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and workflow.

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Detailed development guide and best practices
- **[TESTING.md](./TESTING.md)** - Testing strategies and examples
- **[SECURITY.md](./SECURITY.md)** - Security policy and vulnerability reporting

## License

GNU General Public License v3.0