# Foreman UI Plugin Testing Guide

This guide covers testing strategies, tools, and best practices for Foreman UI plugins.

## Table of Contents

- [Overview](#overview)
- [Testing Setup](#testing-setup)
- [Testing Strategies](#testing-strategies)
- [Unit Testing](#unit-testing)
- [Component Testing](#component-testing)
- [Integration Testing](#integration-testing)
- [Plugin Registry Testing](#plugin-registry-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Testing Best Practices](#testing-best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

Testing is crucial for plugin reliability and maintenance. This guide covers:

- **Unit Tests**: Individual functions and hooks
- **Component Tests**: React component behavior
- **Integration Tests**: Plugin integration with Foreman UI
- **E2E Tests**: Full user workflows
- **Performance Tests**: Resource usage and responsiveness

## Testing Setup

### Dependencies

```bash
# Core testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event @vitejs/plugin-react
npm install -D jsdom happy-dom

# Additional testing utilities
npm install -D @testing-library/react-hooks msw
```

### Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Testing Strategies

### Test Pyramid

```
     E2E Tests (Few)
        ↑
   Integration Tests (Some)
        ↑
    Unit Tests (Many)
```

1. **Unit Tests (70%)**: Test individual functions, hooks, utilities
2. **Integration Tests (20%)**: Test component interactions and plugin integration
3. **E2E Tests (10%)**: Test complete user workflows

### Testing Philosophy

- **Test behavior, not implementation**
- **Write tests first (TDD) when possible**
- **Keep tests simple and focused**
- **Use realistic test data**
- **Mock external dependencies**

## Unit Testing

### Testing Utilities

Create `src/utils/__tests__/formatters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatBytes, formatUptime, formatPercentage } from '../formatters';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('handles edge cases', () => {
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(Infinity)).toBe('∞ B');
  });
});

describe('formatUptime', () => {
  it('formats uptime correctly', () => {
    expect(formatUptime(0)).toBe('0d 0h 0m');
    expect(formatUptime(3661)).toBe('0d 1h 1m');
    expect(formatUptime(86400)).toBe('1d 0h 0m');
    expect(formatUptime(90061)).toBe('1d 1h 1m');
  });
});

describe('formatPercentage', () => {
  it('formats percentages correctly', () => {
    expect(formatPercentage(0.5)).toBe('50.0%');
    expect(formatPercentage(1)).toBe('100.0%');
    expect(formatPercentage(0.123)).toBe('12.3%');
  });

  it('handles edge cases', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(-0.1)).toBe('0.0%');
    expect(formatPercentage(1.5)).toBe('100.0%');
  });
});
```

### Testing Custom Hooks

Create `src/hooks/__tests__/useSystemInfo.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSystemInfo } from '../useSystemInfo';

// Mock fetch
global.fetch = vi.fn();

describe('useSystemInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially', () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useSystemInfo());

    expect(result.current.loading).toBe(true);
    expect(result.current.systemInfo).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('fetches and returns system info successfully', async () => {
    const mockSystemInfo = {
      hostname: 'test.example.com',
      uptime: 86400,
      load: [0.5, 0.3, 0.2],
      memory: { total: 8192, free: 4096, used: 4096 },
      disk: { total: 100000, free: 60000, used: 40000 }
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSystemInfo,
    } as Response);

    const { result } = renderHook(() => useSystemInfo(100)); // Short interval for testing

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.systemInfo).toEqual(mockSystemInfo);
    expect(result.current.error).toBe(null);
  });

  it('handles fetch errors gracefully', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSystemInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.systemInfo).toEqual(expect.objectContaining({
      hostname: 'foreman.example.com' // Mock fallback data
    }));
    expect(result.current.error).toBe('Network error');
  });

  it('handles HTTP errors', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useSystemInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP 500: Internal Server Error');
  });

  it('refetches data at specified intervals', async () => {
    vi.useFakeTimers();

    const mockSystemInfo = { hostname: 'test.com', uptime: 100, load: [], memory: {}, disk: {} };
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSystemInfo,
    } as Response);

    renderHook(() => useSystemInfo(1000)); // 1 second interval

    // Initial fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time and check for additional fetches
    vi.advanceTimersByTime(1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1000);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
```

## Component Testing

### Testing Dashboard Widgets

Create `src/components/__tests__/SystemInfoWidget.test.tsx`:

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SystemInfoWidget } from '../SystemInfoWidget';

// Mock the custom hook
vi.mock('../../hooks/useSystemInfo', () => ({
  useSystemInfo: vi.fn()
}));

import { useSystemInfo } from '../../hooks/useSystemInfo';

const mockUseSystemInfo = vi.mocked(useSystemInfo);

describe('SystemInfoWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading spinner when loading', () => {
    mockUseSystemInfo.mockReturnValue({
      systemInfo: null,
      loading: true,
      error: null,
    });

    render(<SystemInfoWidget title="Test Widget" />);

    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when error occurs', () => {
    mockUseSystemInfo.mockReturnValue({
      systemInfo: null,
      loading: false,
      error: 'Network error',
    });

    render(<SystemInfoWidget title="Test Widget" />);

    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText(/Error loading system information/)).toBeInTheDocument();
  });

  it('displays system information when loaded successfully', () => {
    const mockSystemInfo = {
      hostname: 'test.example.com',
      uptime: 86400, // 1 day
      load: [0.5, 0.3, 0.2],
      memory: { total: 8192, free: 4096, used: 4096 },
      disk: { total: 100000, free: 60000, used: 40000 }
    };

    mockUseSystemInfo.mockReturnValue({
      systemInfo: mockSystemInfo,
      loading: false,
      error: null,
    });

    render(<SystemInfoWidget title="System Info" />);

    expect(screen.getByText('System Info')).toBeInTheDocument();
    expect(screen.getByText('test.example.com')).toBeInTheDocument();
    expect(screen.getByText(/Uptime: 1d 0h/)).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Disk Usage')).toBeInTheDocument();
  });

  it('calculates progress percentages correctly', () => {
    const mockSystemInfo = {
      hostname: 'test.example.com',
      uptime: 3600,
      load: [0.1, 0.2, 0.3],
      memory: { total: 1000, free: 200, used: 800 }, // 80% used
      disk: { total: 1000, free: 900, used: 100 }    // 10% used
    };

    mockUseSystemInfo.mockReturnValue({
      systemInfo: mockSystemInfo,
      loading: false,
      error: null,
    });

    render(<SystemInfoWidget />);

    // Check that progress bars are rendered
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2); // Memory and disk
  });

  it('uses default title when none provided', () => {
    mockUseSystemInfo.mockReturnValue({
      systemInfo: {
        hostname: 'test.com',
        uptime: 0,
        load: [],
        memory: { total: 1000, free: 500, used: 500 },
        disk: { total: 1000, free: 500, used: 500 }
      },
      loading: false,
      error: null,
    });

    render(<SystemInfoWidget />);

    expect(screen.getByText('System Information')).toBeInTheDocument();
  });
});
```

### Testing Page Components

Create `src/components/__tests__/ServerMonitorPage.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ServerMonitorPage } from '../ServerMonitorPage';

// Mock components
vi.mock('../SystemInfoWidget', () => ({
  SystemInfoWidget: ({ title }: { title: string }) => (
    <div data-testid="system-info-widget">{title}</div>
  )
}));

// Mock hooks
vi.mock('../../hooks/useSystemInfo', () => ({
  useSystemInfo: vi.fn()
}));

import { useSystemInfo } from '../../hooks/useSystemInfo';

const mockUseSystemInfo = vi.mocked(useSystemInfo);

// Wrapper component for React Router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ServerMonitorPage', () => {
  const defaultProps = {
    pluginDisplayName: 'Test Monitor',
    pluginName: 'test_monitor'
  };

  beforeEach(() => {
    mockUseSystemInfo.mockReturnValue({
      systemInfo: null,
      loading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and navigation', () => {
    render(
      <RouterWrapper>
        <ServerMonitorPage {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText('Test Monitor')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText(/Monitor system performance/)).toBeInTheDocument();
  });

  it('renders system info widget', () => {
    render(
      <RouterWrapper>
        <ServerMonitorPage {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByTestId('system-info-widget')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const mockRefetch = vi.fn();
    mockUseSystemInfo.mockReturnValue({
      systemInfo: null,
      loading: false,
      error: null,
      refetch: mockRefetch
    });

    render(
      <RouterWrapper>
        <ServerMonitorPage {...defaultProps} />
      </RouterWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on refresh button', () => {
    mockUseSystemInfo.mockReturnValue({
      systemInfo: null,
      loading: true,
      error: null,
      refetch: vi.fn()
    });

    render(
      <RouterWrapper>
        <ServerMonitorPage {...defaultProps} />
      </RouterWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders action buttons', () => {
    render(
      <RouterWrapper>
        <ServerMonitorPage {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText('View Detailed Metrics')).toBeInTheDocument();
    expect(screen.getByText('Configure Alerts')).toBeInTheDocument();
    expect(screen.getByText('Export Report')).toBeInTheDocument();
  });
});
```

## Integration Testing

### Testing Plugin Registration

Create `src/__tests__/plugin-integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForemanPluginRegistry } from '@foreman/shared';
import { serverMonitorPlugin } from '../plugin';

describe('Plugin Integration', () => {
  let registry: ForemanPluginRegistry;

  beforeEach(() => {
    registry = new ForemanPluginRegistry();
  });

  it('registers plugin successfully', async () => {
    await registry.register(serverMonitorPlugin);

    expect(registry.isRegistered('foreman_server_monitor')).toBe(true);
    expect(registry.getPlugin('foreman_server_monitor')).toEqual(serverMonitorPlugin);
  });

  it('provides dashboard widgets', async () => {
    await registry.register(serverMonitorPlugin);

    const widgets = registry.getPluginsWithWidgets();
    expect(widgets).toHaveLength(1);
    expect(widgets[0].id).toBe('system-info-widget');
    expect(widgets[0].title).toBe('System Information');
  });

  it('registers permissions correctly', async () => {
    await registry.register(serverMonitorPlugin);

    const plugin = registry.getPlugin('foreman_server_monitor');
    expect(plugin?.permissions).toHaveLength(1);
    expect(plugin?.permissions?.[0].name).toBe('view_server_monitor');
  });

  it('handles plugin initialization', async () => {
    const initializeSpy = vi.spyOn(serverMonitorPlugin, 'initialize');

    await registry.register(serverMonitorPlugin);

    expect(initializeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginRegistry: registry,
        i18n: expect.any(Object)
      })
    );
  });

  it('handles plugin destruction', async () => {
    const destroySpy = vi.spyOn(serverMonitorPlugin, 'destroy');

    await registry.register(serverMonitorPlugin);
    await registry.unregister('foreman_server_monitor');

    expect(destroySpy).toHaveBeenCalled();
    expect(registry.isRegistered('foreman_server_monitor')).toBe(false);
  });
});
```

### Testing with Mock Services

Create `src/__tests__/plugin-with-services.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemInfoWidget } from '../components/SystemInfoWidget';

// Mock the Foreman shared library
vi.mock('@foreman/shared', async () => {
  const actual = await vi.importActual('@foreman/shared');
  return {
    ...actual,
    useCurrentUserData: () => ({
      data: { name: 'Test User', roles: [] },
      loading: false,
      error: null
    }),
    hasPluginPermissions: () => true
  };
});

describe('Plugin with Services', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('integrates with user authentication', () => {
    renderWithProviders(<SystemInfoWidget />);

    // Widget should render since user has permissions
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });
});
```

## Plugin Registry Testing

### Testing Plugin Validation

Create `src/__tests__/plugin-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ForemanPluginRegistry } from '@foreman/shared';
import { ForemanPlugin } from '@foreman/shared';

describe('Plugin Validation', () => {
  let registry: ForemanPluginRegistry;

  beforeEach(() => {
    registry = new ForemanPluginRegistry();
  });

  it('rejects plugin without name', async () => {
    const invalidPlugin = {
      version: '1.0.0',
      displayName: 'Test'
    } as ForemanPlugin;

    await expect(registry.register(invalidPlugin)).rejects.toThrow('Plugin must have a name');
  });

  it('rejects plugin without version', async () => {
    const invalidPlugin = {
      name: 'test_plugin',
      displayName: 'Test'
    } as ForemanPlugin;

    await expect(registry.register(invalidPlugin)).rejects.toThrow('Plugin must have a version');
  });

  it('rejects duplicate plugin names', async () => {
    const plugin1: ForemanPlugin = {
      name: 'test_plugin',
      version: '1.0.0',
      displayName: 'Test Plugin 1'
    };

    const plugin2: ForemanPlugin = {
      name: 'test_plugin',
      version: '2.0.0',
      displayName: 'Test Plugin 2'
    };

    await registry.register(plugin1);
    await expect(registry.register(plugin2)).rejects.toThrow('Plugin test_plugin is already registered');
  });

  it('validates route structure', async () => {
    const invalidPlugin: ForemanPlugin = {
      name: 'test_plugin',
      version: '1.0.0',
      displayName: 'Test',
      routes: [
        { element: () => null } as any // Missing path
      ]
    };

    await expect(registry.register(invalidPlugin)).rejects.toThrow('route at index 0 must have a path');
  });

  it('validates menu item structure', async () => {
    const invalidPlugin: ForemanPlugin = {
      name: 'test_plugin',
      version: '1.0.0',
      displayName: 'Test',
      menuItems: [
        { id: 'test' } as any // Missing label
      ]
    };

    await expect(registry.register(invalidPlugin)).rejects.toThrow('must have either label or labelKey');
  });
});
```

## E2E Testing

### Playwright Setup

```bash
npm install -D @playwright/test
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

Create `e2e/plugin-functionality.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Server Monitor Plugin', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Login if required
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
  });

  test('displays plugin in navigation menu', async ({ page }) => {
    // Check if plugin menu item exists
    await expect(page.locator('text=Server Monitor')).toBeVisible();
  });

  test('navigates to plugin page', async ({ page }) => {
    // Click on plugin menu item
    await page.click('text=Server Monitor');

    // Verify we're on the plugin page
    await expect(page).toHaveURL('/server-monitor');
    await expect(page.locator('h1:has-text("Server Monitor")')).toBeVisible();
  });

  test('displays system information widget on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Check if widget is present
    await expect(page.locator('[data-testid="system-info-widget"]')).toBeVisible();
    await expect(page.locator('text=System Information')).toBeVisible();
  });

  test('refreshes data when refresh button is clicked', async ({ page }) => {
    await page.goto('/server-monitor');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Click refresh button
    await page.click('button:has-text("Refresh")');

    // Check for loading state
    await expect(page.locator('button:has-text("Refresh")[aria-disabled="true"]')).toBeVisible();

    // Wait for loading to complete
    await expect(page.locator('button:has-text("Refresh")[aria-disabled="true"]')).not.toBeVisible();
  });

  test('handles errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/system/info', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/server-monitor');

    // Check that error is displayed gracefully
    await expect(page.locator('text=Error loading system information')).toBeVisible();
  });
});
```

## Performance Testing

### Component Performance

Create `src/__tests__/performance.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { SystemInfoWidget } from '../components/SystemInfoWidget';

describe('Performance Tests', () => {
  it('renders widget within performance budget', () => {
    // Mock hook to return large dataset
    vi.doMock('../hooks/useSystemInfo', () => ({
      useSystemInfo: () => ({
        systemInfo: {
          hostname: 'test.example.com',
          uptime: 86400,
          load: new Array(1000).fill(0.5), // Large array
          memory: { total: 8192, free: 4096, used: 4096 },
          disk: { total: 100000, free: 60000, used: 40000 }
        },
        loading: false,
        error: null,
      })
    }));

    const startTime = performance.now();

    render(<SystemInfoWidget />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Widget should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles frequent updates efficiently', () => {
    const mockSystemInfo = {
      hostname: 'test.com',
      uptime: 0,
      load: [0.1, 0.2, 0.3],
      memory: { total: 1000, free: 500, used: 500 },
      disk: { total: 1000, free: 500, used: 500 }
    };

    vi.doMock('../hooks/useSystemInfo', () => ({
      useSystemInfo: () => ({
        systemInfo: mockSystemInfo,
        loading: false,
        error: null,
      })
    }));

    const renderTimes: number[] = [];

    // Simulate multiple re-renders
    for (let i = 0; i < 10; i++) {
      mockSystemInfo.uptime = i * 1000;

      const startTime = performance.now();
      const { rerender } = render(<SystemInfoWidget />);
      rerender(<SystemInfoWidget />);
      const endTime = performance.now();

      renderTimes.push(endTime - startTime);
    }

    // Average render time should be reasonable
    const averageTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    expect(averageTime).toBeLessThan(50);
  });
});
```

### Memory Leak Testing

```typescript
describe('Memory Leak Tests', () => {
  it('cleans up timers on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<SystemInfoWidget />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('cleans up event listeners', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<SystemInfoWidget />);

    unmount();

    // Verify cleanup if your component adds event listeners
    // expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
```

## Testing Best Practices

### 1. Test Structure

```typescript
describe('Component/Feature Name', () => {
  // Setup and cleanup
  beforeEach(() => {
    // Common setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('when in normal state', () => {
    it('should behave correctly', () => {
      // Test normal behavior
    });
  });

  describe('when in error state', () => {
    it('should handle errors gracefully', () => {
      // Test error handling
    });
  });

  describe('when loading', () => {
    it('should show loading indicators', () => {
      // Test loading states
    });
  });
});
```

### 2. Test Data Management

```typescript
// Create test data factories
export const createMockSystemInfo = (overrides = {}) => ({
  hostname: 'test.example.com',
  uptime: 86400,
  load: [0.5, 0.3, 0.2],
  memory: { total: 8192, free: 4096, used: 4096 },
  disk: { total: 100000, free: 60000, used: 40000 },
  ...overrides
});

// Use in tests
const systemInfo = createMockSystemInfo({ hostname: 'custom.host.com' });
```

### 3. Async Testing

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// Use findBy for async elements
const element = await screen.findByText('Async content');
expect(element).toBeInTheDocument();
```

### 4. User Interaction Testing

```typescript
import userEvent from '@testing-library/user-event';

test('handles user interactions', async () => {
  const user = userEvent.setup();

  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: 'Submit' }));
  await user.type(screen.getByLabelText('Input'), 'test value');

  expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
});
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:coverage

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build plugin
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: plugin-build
        path: dist/
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "build": "tsc && vite build"
  }
}
```

This comprehensive testing guide ensures your Foreman UI plugins are reliable, maintainable, and production-ready. Combine these testing strategies with the [Plugin API Reference](PLUGIN_API.md) and [Development Guide](PLUGIN_DEVELOPMENT.md) for complete plugin development coverage.