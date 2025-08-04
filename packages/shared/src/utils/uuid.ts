/**
 * Utility for generating UUIDs with proper fallback handling
 */

/**
 * Generates a cryptographically secure UUID v4
 *
 * Uses the following priority:
 * 1. crypto.randomUUID() - Modern browsers with native UUID support
 * 2. crypto.getRandomValues() - Browsers with Web Crypto API
 * 3. Throws error - Avoids insecure fallbacks in production
 *
 * @returns A RFC 4122 compliant UUID v4 string
 * @throws Error if no secure UUID generation method is available
 */
export const generateSecureUUID = (): string => {
  // First choice: Native UUID generation (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Second choice: Web Crypto API with manual UUID construction
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant bits according to RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

    // Convert to hex string with proper formatting
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  // No secure methods available - fail fast
  throw new Error('Secure UUID generation is not available. Please ensure crypto.randomUUID or crypto.getRandomValues is supported.');
};

/**
 * Generates a UUID with development fallback
 *
 * This should only be used in development/testing environments where
 * security is not critical. Production code should use generateSecureUUID().
 *
 * @returns A UUID v4 string (secure if possible, otherwise development fallback)
 */
export const generateUUID = (): string => {
  try {
    return generateSecureUUID();
  } catch {
    // Development/testing fallback - warn about security implications
    // Improved production environment detection using reliable environment variables
    const isProduction =
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ||
      (typeof process !== 'undefined' && process.env?.REACT_APP_ENV === 'production') ||
      (typeof process !== 'undefined' && process.env?.ENVIRONMENT === 'production');

    if (isProduction) {
      throw new Error('Secure UUID generation is required in production environments');
    }

    console.warn('Using development UUID fallback. This should not be used in production or high-frequency scenarios due to potential collision risk.');

    // Enhanced development fallback with better collision resistance
    // Uses timestamp, process ID, counter, and multiple random components
    const timestamp = Date.now().toString(36);
    const processId = (typeof process !== 'undefined' && process.pid) ? process.pid.toString(36) : '0';
    const counter = Math.floor(Math.random() * 0xffffff).toString(36).padStart(4, '0');
    const random1 = Math.random().toString(36).substring(2, 6);
    const random2 = Math.random().toString(36).substring(2, 6);
    const random3 = Math.random().toString(36).substring(2, 10);

    // Format: timestamp-processId-4counter-random1random2-random3
    return `${timestamp}-${processId}-4${counter}-${random1}${random2}-${random3}`;
  }
};