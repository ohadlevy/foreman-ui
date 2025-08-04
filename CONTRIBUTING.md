# Contributing to Foreman UI

Thank you for considering contributing to Foreman UI! This guide will help you get started.

## Development Setup

1. **Prerequisites**
   - See [README.md](./README.md#prerequisites) for system requirements

2. **Clone and Install**
   ```bash
   git clone https://github.com/ohadlevy/foreman-ui.git
   cd foreman-ui
   ./setup.sh  # Automated setup (recommended)
   # OR: yarn install && yarn build:shared
   ```

3. **Start Development**
   ```bash
   # Start user portal
   yarn dev:user

   # Or start all packages
   yarn dev
   ```

📖 **For detailed development workflows, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

## Development Workflow

### Code Quality
```bash
# Run tests
yarn test

# Run linter (with auto-fix)
yarn lint:fix

# Type check
npx tsc --noEmit

# Build packages
yarn build
```

### Testing
- Write tests for new functionality
- Ensure all tests pass before submitting
- Use existing test patterns from `__tests__` folders

### Code Style
- TypeScript for all new code
- Follow existing ESLint configuration
- Use PatternFly components when possible
- Write meaningful commit messages

## Project Structure

```
foreman-ui/
├── packages/
│   ├── shared/           # Shared library (components, hooks, API)
│   └── user-portal/      # User self-service portal
├── .github/              # GitHub workflows and templates
└── docs/                 # Additional documentation
```

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch from `main`
3. **Make** your changes with tests
4. **Ensure** all checks pass:
   ```bash
   yarn lint && yarn test && yarn build
   ```
5. **Submit** a pull request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Link to any related issues

## Getting Help

- 📖 Check existing documentation in `docs/`
- 🐛 Search existing [issues](https://github.com/ohadlevy/foreman-ui/issues)
- 💬 Open a [discussion](https://github.com/ohadlevy/foreman-ui/discussions) for questions
- 🚀 Join the [Foreman community](https://community.theforeman.org/)

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.