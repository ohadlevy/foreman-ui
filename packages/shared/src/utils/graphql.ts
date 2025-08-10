/**
 * GraphQL utility functions for Foreman API integration
 */

/**
 * Parse a GraphQL ID to extract the numeric ID
 * GraphQL IDs are typically base64 encoded strings containing type and ID information
 */
export function parseGraphQLId(graphqlId: string): number {
  try {
    // Foreman GraphQL IDs are typically in format: gid://foreman/Model/123
    // or base64 encoded versions of the same
    
    // First try direct parsing if it's already in the gid:// format
    if (graphqlId.startsWith('gid://')) {
      const parts = graphqlId.split('/');
      const id = parts[parts.length - 1];
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    // Try base64 decoding
    try {
      const decoded = atob(graphqlId);
      if (decoded.startsWith('gid://')) {
        const parts = decoded.split('/');
        const id = parts[parts.length - 1];
        const parsed = parseInt(id, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Base64 decode failed, continue to fallback
    }
    
    // Fallback: try direct integer parsing
    const directParsed = parseInt(graphqlId, 10);
    if (!isNaN(directParsed)) {
      return directParsed;
    }
    
    throw new Error(`Unable to parse GraphQL ID: ${graphqlId}`);
  } catch {
    throw new Error(`Invalid GraphQL ID format: ${graphqlId}`);
  }
}
