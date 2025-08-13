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

// Polyfill for HTMLFormElement.requestSubmit (not implemented in JSdom)
// eslint-disable-next-line no-undef
if (typeof HTMLFormElement !== 'undefined' && !HTMLFormElement.prototype.requestSubmit) {
  // eslint-disable-next-line no-undef
  HTMLFormElement.prototype.requestSubmit = function (submitter?: HTMLElement) {
    // Log warning about limited submitter functionality in test environment
    if (submitter && console.warn) {
      console.warn('JSdom polyfill: requestSubmit submitter parameter is not fully supported in test environment');
    }
    
    // Basic submitter functionality: if submitter has a name/value, add it to form data
    // eslint-disable-next-line no-undef
    if (submitter && submitter instanceof HTMLInputElement && submitter.name && submitter.value) {
      // Create a hidden input to simulate submitter data
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = submitter.name;
      hiddenInput.value = submitter.value;
      this.appendChild(hiddenInput);
      
      // Remove after event dispatch
      setTimeout(() => {
        if (hiddenInput.parentNode) {
          hiddenInput.parentNode.removeChild(hiddenInput);
        }
      }, 0);
    }
    
    // eslint-disable-next-line no-undef
    const event = new Event('submit', { bubbles: true, cancelable: true });
    this.dispatchEvent(event);
  };
}

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