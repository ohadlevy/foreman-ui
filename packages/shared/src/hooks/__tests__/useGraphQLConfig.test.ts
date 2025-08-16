import { describe, it, expect, beforeEach } from 'vitest';
import { isGraphQLEnabled, setGlobalGraphQLEnabled, useGraphQLConfig, useGraphQLConfigActions } from '../useGraphQLConfig';

describe('GraphQL Configuration', () => {
  beforeEach(() => {
    // Reset to default state
    setGlobalGraphQLEnabled(true);
  });

  describe('isGraphQLEnabled', () => {
    it('should return true by default', () => {
      expect(isGraphQLEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      setGlobalGraphQLEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
    });

    it('should return true when re-enabled', () => {
      setGlobalGraphQLEnabled(false);
      setGlobalGraphQLEnabled(true);
      expect(isGraphQLEnabled()).toBe(true);
    });
  });

  describe('setGlobalGraphQLEnabled', () => {
    it('should update the global state', () => {
      expect(isGraphQLEnabled()).toBe(true);
      
      setGlobalGraphQLEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
      
      setGlobalGraphQLEnabled(true);
      expect(isGraphQLEnabled()).toBe(true);
    });
  });

  describe('useGraphQLConfig', () => {
    it('should return the current enabled state', () => {
      const config = useGraphQLConfig();
      expect(config.isGraphQLEnabled).toBe(true);
      expect(config.shouldUseGraphQL).toBe(true);
    });

    it('should reflect changes in global state', () => {
      setGlobalGraphQLEnabled(false);
      const config = useGraphQLConfig();
      expect(config.isGraphQLEnabled).toBe(false);
      expect(config.shouldUseGraphQL).toBe(false);
    });
  });

  describe('useGraphQLConfigActions', () => {
    it('should provide the setter function', () => {
      const actions = useGraphQLConfigActions();
      expect(typeof actions.setGraphQLEnabled).toBe('function');
    });

    it('should update the global state through actions', () => {
      const actions = useGraphQLConfigActions();
      
      expect(isGraphQLEnabled()).toBe(true);
      
      actions.setGraphQLEnabled(false);
      expect(isGraphQLEnabled()).toBe(false);
      
      actions.setGraphQLEnabled(true);
      expect(isGraphQLEnabled()).toBe(true);
    });
  });
});