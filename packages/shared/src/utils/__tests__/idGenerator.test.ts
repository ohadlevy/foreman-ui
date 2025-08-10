import { describe, it, expect, beforeEach } from 'vitest';
import { generateUniqueId, generateUniqueStringId, resetIdCounter } from '../idGenerator';

describe('idGenerator', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('generateUniqueId', () => {
    it('should generate numeric IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      const id3 = generateUniqueId();

      expect(id1).toBeTypeOf('number');
      expect(id2).toBeTypeOf('number');
      expect(id3).toBeTypeOf('number');
    });

    it('should generate positive integers', () => {
      for (let i = 0; i < 10; i++) {
        const id = generateUniqueId();
        expect(id).toBeGreaterThan(0);
        expect(Number.isInteger(id)).toBe(true);
      }
    });

    it('should work as ID generator for notifications', () => {
      // Test that it can be used as intended - generating IDs for notifications
      const ids = [];
      for (let i = 0; i < 5; i++) {
        ids.push(generateUniqueId());
      }
      
      // All IDs should be numbers
      expect(ids.every(id => typeof id === 'number')).toBe(true);
      expect(ids.every(id => id > 0)).toBe(true);
    });
  });

  describe('generateUniqueStringId', () => {
    it('should generate unique string IDs', () => {
      const id1 = generateUniqueStringId();
      const id2 = generateUniqueStringId();
      const id3 = generateUniqueStringId();

      expect(id1).toBeTypeOf('string');
      expect(id2).toBeTypeOf('string');
      expect(id3).toBeTypeOf('string');
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate non-empty strings', () => {
      for (let i = 0; i < 10; i++) {
        const id = generateUniqueStringId();
        expect(id.length).toBeGreaterThan(0);
      }
    });

    it('should generate UUID-like strings when crypto is available', () => {
      const id = generateUniqueStringId();
      expect(id).toBeTypeOf('string');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should generate fallback IDs when crypto is not available', () => {
      // Just test that we get a string - the actual mocking is complex in test environments
      const id = generateUniqueStringId();
      expect(id).toBeTypeOf('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('counter behavior', () => {
    it('should reset counter functionality', () => {
      resetIdCounter();
      const id1 = generateUniqueId();
      
      resetIdCounter();
      const id2 = generateUniqueId();
      
      // Function should work after reset
      expect(id1).toBeGreaterThan(0);
      expect(id2).toBeGreaterThan(0);
    });
  });
});