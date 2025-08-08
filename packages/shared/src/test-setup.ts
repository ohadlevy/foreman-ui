import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock environment variables
process.env.REACT_APP_API_URL = '/api/v2';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3001',
    origin: 'http://localhost:3001',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

// Clean up after each test
afterEach(() => {
  cleanup();
  // Clear any pending timers
  vi.clearAllTimers();
  // Clear all mocks
  vi.clearAllMocks();
});