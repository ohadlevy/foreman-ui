/**
 * GraphQL utility functions for Foreman API integration
 */

/**
 * Sanitize GraphQL ID for error messages to prevent information disclosure
 */
function sanitizeGraphqlId(graphqlId: string): string {
  // Truncate long IDs and mask potential sensitive information
  if (graphqlId.length > 20) {
    return `${graphqlId.substring(0, 10)}...${graphqlId.substring(graphqlId.length - 4)}`;
  }
  return graphqlId.replace(/[^a-zA-Z0-9-_./]/g, '*');
}

/**
 * Parse a GraphQL ID to extract the numeric ID
 * GraphQL IDs are typically base64 encoded strings containing type and ID information
 */
export function parseGraphQLId(graphqlId: string): number {
  try {
    // Foreman GraphQL IDs can be in various formats:
    // 1. Direct numeric: "123"
    // 2. gid:// format: "gid://foreman/Model/123"
    // 3. Base64 encoded various formats
    
    // First try direct parsing if it's numeric
    const directParsed = parseInt(graphqlId, 10);
    if (!isNaN(directParsed) && directParsed > 0) {
      return directParsed;
    }
    
    // Try gid:// format
    if (graphqlId.startsWith('gid://')) {
      const parts = graphqlId.split('/');
      const id = parts[parts.length - 1];
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    // Try base64 decoding
    // Validate base64 format before decoding
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    if (base64Regex.test(graphqlId)) {
      try {
        const decoded = atob(graphqlId);
        
        // Handle gid:// format in decoded string
        if (decoded.startsWith('gid://')) {
          const parts = decoded.split('/');
          const id = parts[parts.length - 1];
          const parsed = parseInt(id, 10);
          if (!isNaN(parsed)) {
            return parsed;
          }
        }
        
        // Handle Foreman GraphQL ID format like "0:User-6" -> extract the number after the last separator
        const foremanMatch = decoded.match(/[:][^:/]+-(\d+)$|[-][^:/-]+-(\d+)$/);
        if (foremanMatch) {
          const parsed = parseInt(foremanMatch[1] || foremanMatch[2], 10);
          if (!isNaN(parsed) && parsed > 0) {
            return parsed;
          }
        }
        
        // Try direct parsing of decoded string
        const decodedParsed = parseInt(decoded, 10);
        if (!isNaN(decodedParsed) && decodedParsed > 0) {
          return decodedParsed;
        }
      } catch {
        // Base64 decode failed, continue to fallback
      }
    }
    
    throw new Error(`Unable to parse GraphQL ID: ${sanitizeGraphqlId(graphqlId)}`);
  } catch (err) {
    throw new Error(`Invalid GraphQL ID format: ${sanitizeGraphqlId(graphqlId)}. Original error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
