/**
 * Utility functions for handling GraphQL operations and data parsing
 */

/**
 * Parse GraphQL ID to numeric ID
 * Handles both direct numeric IDs and base64-encoded IDs like "T3JnYW5pemF0aW9uLTU="
 */
export function parseGraphQLId(rawId: string): number {
  if (!rawId || typeof rawId !== 'string') {
    throw new Error('Invalid ID: must be a non-empty string');
  }

  // Try direct numeric ID first
  const directId = Number.parseInt(rawId, 10);
  if (!Number.isNaN(directId) && directId > 0) {
    return directId;
  }

  // Handle base64-encoded IDs with improved regex validation
  const base64Pattern = /^[A-Za-z0-9+/]{4,}={0,2}$/;
  if (base64Pattern.test(rawId)) {
    try {
      const decoded = atob(rawId);

      // Look for numeric suffix in decoded string (e.g., "Organization-5" -> 5)
      const numericMatch = decoded.match(/(\d+)$/);
      if (numericMatch) {
        const parsedId = Number.parseInt(numericMatch[1], 10);
        if (!Number.isNaN(parsedId) && parsedId > 0) {
          return parsedId;
        }
      }
    } catch {
      // Invalid base64, fall through to error
    }
  }

  throw new Error(`Invalid GraphQL ID format: ${rawId}`);
}

/**
 * Validate if a string is a valid base64-encoded credential format (username:password)
 * Uses more robust pattern matching for security
 */
export function validateBase64Credential(token: string): boolean {
  if (!token || typeof token !== 'string' || token.length < 4) {
    return false;
  }

  // Strengthened regex for base64 validation
  const base64Pattern = /^[A-Za-z0-9+/]{4,}={0,2}$/;
  if (!base64Pattern.test(token)) {
    return false;
  }

  try {
    const decoded = atob(token);
    // Validate credential format (username:password) with minimum password length (8+)
    const credentialPattern = /^([a-zA-Z0-9._-]+):(.{8,})$/;
    const match = decoded.match(credentialPattern);
    return !!match;
  } catch {
    return false;
  }
}