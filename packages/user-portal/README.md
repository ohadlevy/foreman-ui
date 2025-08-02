# Foreman User Portal

A modern React-based self-service portal for Foreman users to manage their infrastructure.

## Features

- **Dashboard**: Overview of user's hosts and quick actions
- **Host Management**: Create, view, edit, and manage personal hosts
- **Profile Management**: Update user profile and change password
- **Modern UI**: Built with PatternFly v5 for consistent enterprise UX
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

See [main README](../../README.md#prerequisites) for system requirements.

### Installation

```bash
# From the monorepo root
yarn install

# Start the user portal in development mode
yarn dev:user
```

The application will be available at `http://localhost:3001`.

### Environment Configuration

Create a `.env.local` file in this directory:

```bash
REACT_APP_API_URL=http://your-foreman-instance.com/api/v2
REACT_APP_GRAPHQL_URL=http://your-foreman-instance.com/graphql
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run tests
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint issues

## Project Structure

```
src/
├── pages/           # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   └── Hosts/
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## API Integration

This app uses the shared `@foreman/shared` package which provides:

- Pre-configured API clients for Foreman v2 API
- React hooks for data fetching and mutations
- Authentication and authorization helpers
- Reusable UI components

## Authentication

The app supports:

- Username/password authentication
- Personal Access Token authentication
- Automatic token refresh
- Role-based access control

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

GNU General Public License v3.0