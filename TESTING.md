# Testing Guide

This project uses **Vitest** and **React Testing Library** for comprehensive testing.

## Test Structure

```
packages/
├── shared/
│   ├── src/
│   │   ├── auth/__tests__/
│   │   │   ├── AuthAPI.test.ts
│   │   │   ├── store.test.ts
│   │   │   └── useAuth.test.tsx
│   │   ├── api/__tests__/
│   │   │   └── client.test.ts
│   │   └── test-setup.ts
│   └── vitest.config.ts
└── user-portal/
    ├── src/
    │   ├── pages/__tests__/
    │   │   └── SimpleLogin.test.tsx
    │   └── __tests__/
    │       └── App.integration.test.tsx
    └── vitest.config.ts
```

## Running Tests

### All Tests
```bash
# Run all tests across all packages
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

### Package-Specific Tests
```bash
# Test only shared package
yarn test:shared

# Test only user-portal package
yarn test:user
```

### Individual Test Files
```bash
# Run specific test file
yarn workspace @foreman/shared test auth/__tests__/store.test.ts

# Run tests matching pattern
yarn workspace @foreman/shared test --grep "authentication"
```

## Test Categories

### 1. Unit Tests

**Authentication Store (`auth/store.test.ts`)**
- Tests Zustand store state management
- Covers login/logout actions
- Tests permission checking logic
- Validates localStorage integration

**API Client (`api/client.test.ts`)**
- Tests HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Tests authentication headers
- Tests error handling
- Tests singleton pattern

**Auth API (`auth/AuthAPI.test.ts`)**
- Tests login flow with valid/invalid credentials
- Tests token verification
- Tests logout functionality
- Tests error scenarios (401, 403, 500, network errors)

### 2. Component Tests

**SimpleLogin Component (`pages/SimpleLogin.test.tsx`)**
- Tests form rendering and interaction
- Tests login submission
- Tests error display
- Tests accessibility features
- Tests navigation after successful login

### 3. Hook Tests

**useAuth Hook (`auth/useAuth.test.tsx`)**
- Tests hook state management
- Tests React Query integration
- Tests mock mode behavior
- Tests loading states

### 4. Integration Tests

**App Integration (`App.integration.test.tsx`)**
- Tests full authentication flow
- Tests routing behavior
- Tests state transitions
- Tests error handling across components

## Testing Patterns

### Mocking

We use Vitest's `vi.mock()` for mocking dependencies:

```typescript
// Mock external dependencies
vi.mock('@foreman/shared', () => ({
  useAuth: vi.fn(),
  // ... other exports
}));

// Mock API responses
mockAxios.get.mockResolvedValue({ data: mockUser });
```

### Component Testing

Use React Testing Library for component tests:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('should handle form submission', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={mockSubmit} />);

  await user.type(screen.getByLabelText('Username'), 'testuser');
  await user.click(screen.getByRole('button', { name: 'Login' }));

  expect(mockSubmit).toHaveBeenCalledWith({ username: 'testuser' });
});
```

### Async Testing

Use `waitFor` for async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

## Test Configuration

### Global Setup (`test-setup.ts`)

- Configures `@testing-library/jest-dom` matchers
- Mocks `localStorage` and `window.location`
- Sets up environment variables
- Resets mocks between tests

### Vitest Config

Each package has its own `vitest.config.ts`:

- Configures jsdom environment for React testing
- Sets up coverage reporting
- Includes test setup files
- Excludes build artifacts and config files

## Coverage Reports

Coverage reports are generated in:
- `packages/shared/coverage/`
- `packages/user-portal/coverage/`

View HTML reports by opening `coverage/index.html` in your browser.

## Writing New Tests

### Guidelines

1. **Test behavior, not implementation**
   - Focus on what the user sees and does
   - Test outputs and side effects
   - Avoid testing internal state directly

2. **Use descriptive test names**
   ```typescript
   // Good
   it('should show error message when login fails with invalid credentials')

   // Bad
   it('should handle login error')
   ```

3. **Arrange, Act, Assert pattern**
   ```typescript
   it('should update user state after successful login', () => {
     // Arrange
     const mockUser = { id: 1, login: 'testuser' };

     // Act
     act(() => {
       store.getState().login(mockUser, 'token');
     });

     // Assert
     expect(store.getState().user).toEqual(mockUser);
   });
   ```

4. **Test edge cases**
   - Empty inputs
   - Network errors
   - Invalid data
   - Boundary conditions

### Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset mocks and setup
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render correctly', () => {
      // Test basic rendering
    });
  });

  describe('user interactions', () => {
    it('should handle user actions', () => {
      // Test user interactions
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', () => {
      // Test error scenarios
    });
  });
});
```

## Debugging Tests

### Useful Commands

```bash
# Run specific test with verbose output
yarn test:shared --grep "login" --reporter=verbose

# Debug test in browser
yarn test:ui

# Run test with detailed error output
yarn test --reporter=verbose --no-coverage
```

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check environment variables
   - Ensure all dependencies are mocked
   - Check for race conditions in async tests

2. **Mock not working**
   - Ensure mock is called before importing the module
   - Check mock path is correct
   - Verify mock implementation

3. **Component not rendering**
   - Check if all required props are provided
   - Ensure providers (Router, QueryClient) are wrapped
   - Verify no missing dependencies

## Authentication Testing Strategy

Our authentication tests cover:

1. **API Layer**: Direct API calls and responses
2. **State Management**: Zustand store behavior
3. **Hook Layer**: useAuth hook integration
4. **Component Layer**: Login form and user interactions
5. **Integration**: Full authentication flow

This ensures the authentication system is thoroughly tested at all levels.