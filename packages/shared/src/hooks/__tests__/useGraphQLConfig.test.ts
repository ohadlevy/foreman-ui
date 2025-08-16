import { 
  setGlobalGraphQLEnabled, 
  isGraphQLEnabled, 
  useGraphQLConfig, 
  initializeGraphQLConfig 
} from '../useGraphQLConfig';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

describe('GraphQL Configuration', () => {
  beforeEach(() => {
    // Reset to default state before each test
    setGlobalGraphQLEnabled(true);
  });

  describe('setGlobalGraphQLEnabled', () => {
    it('should set GraphQL enabled state', () => {
      setGlobalGraphQLEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
      
      setGlobalGraphQLEnabled(true);
      expect(isGraphQLEnabled()).toBe(true);
    });

    it('should log debug message when setting state', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      setGlobalGraphQLEnabled(false);
      expect(consoleSpy).toHaveBeenCalledWith('GraphQL globally disabled');
      
      setGlobalGraphQLEnabled(true);
      expect(consoleSpy).toHaveBeenCalledWith('GraphQL globally enabled');
      
      consoleSpy.mockRestore();
    });
  });

  describe('isGraphQLEnabled', () => {
    it('should return default true state', () => {
      expect(isGraphQLEnabled()).toBe(true);
    });

    it('should return current state after setting', () => {
      setGlobalGraphQLEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
      
      setGlobalGraphQLEnabled(true);
      expect(isGraphQLEnabled()).toBe(true);
    });
  });

  describe('useGraphQLConfig hook', () => {
    it('should return current state and setter function', () => {
      const { result } = renderHook(() => useGraphQLConfig());
      
      expect(result.current.isEnabled).toBe(true);
      expect(typeof result.current.setEnabled).toBe('function');
    });

    it('should reflect state changes', () => {
      // Change state externally
      setGlobalGraphQLEnabled(false);
      
      // Hook should return updated state (note: this is current state, not reactive)
      const { result: newResult } = renderHook(() => useGraphQLConfig());
      expect(newResult.current.isEnabled).toBe(false);
    });
  });

  describe('initializeGraphQLConfig', () => {
    it('should initialize with default true', () => {
      setGlobalGraphQLEnabled(false); // Set to false first
      
      initializeGraphQLConfig();
      expect(isGraphQLEnabled()).toBe(true);
    });

    it('should initialize with provided value', () => {
      initializeGraphQLConfig(false);
      expect(isGraphQLEnabled()).toBe(false);
      
      initializeGraphQLConfig(true);
      expect(isGraphQLEnabled()).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should maintain state across multiple operations', () => {
      // Start enabled
      expect(isGraphQLEnabled()).toBe(true);
      
      // Disable
      setGlobalGraphQLEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
      
      // Reinitialize with true
      initializeGraphQLConfig(true);
      expect(isGraphQLEnabled()).toBe(true);
      
      // Use hook to set false
      const { result } = renderHook(() => useGraphQLConfig());
      result.current.setEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
    });
  });
});