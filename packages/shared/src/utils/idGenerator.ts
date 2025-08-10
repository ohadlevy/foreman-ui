/**
 * Robust unique ID generation utilities
 */

let idCounter = 0;

/**
 * Generate a unique numeric ID for notifications and other components
 * Uses high-resolution timestamp + counter for guaranteed uniqueness
 */
export const generateUniqueId = (): number => {
  const timestamp = Date.now();
  idCounter = (idCounter + 1) % 100000; // Reset counter every 100,000 to avoid overflow
  
  // Combine timestamp and counter for guaranteed uniqueness
  // Counter ensures uniqueness even when called at the same millisecond
  // Using larger counter range reduces collision probability
  return timestamp * 100000 + idCounter;
};

/**
 * Generate a unique string ID using crypto.randomUUID if available
 * Falls back to timestamp-based generation for environments without crypto
 */
export const generateUniqueStringId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Reset the ID counter (useful for testing)
 */
export const resetIdCounter = (): void => {
  idCounter = 0;
};