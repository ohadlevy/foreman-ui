import type {
  TaxonomyTreeNode,
  TaxonomyEntity,
  TaxonomyApiResponse
} from '../types/taxonomy';

// Memoization cache for separator detection with size limits to prevent memory leaks
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent unbounded growth
const separatorCache = new Map<string, string>();

/**
 * Manage cache size to prevent memory leaks
 */
function manageCacheSize<K, V>(cache: Map<K, V>, maxSize: number): void {
  if (cache.size >= maxSize) {
    // Remove oldest entries (FIFO) when cache reaches max size
    const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(maxSize * 0.2)); // Remove 20% of entries
    keysToDelete.forEach(key => cache.delete(key));
  }
}

/**
 * Detect the hierarchy separator used in the data
 * Supports both " / " (space-slash-space) and "/" (just slash)
 * Memoized for performance to avoid repeated computation
 */
function detectHierarchySeparator<T extends TaxonomyEntity>(entities: T[]): string {
  // Create cache key based on entity names/titles for better cache effectiveness
  const cacheKey = entities.map(e => e.title || e.name).sort().join('|');
  
  // Check cache first
  const cached = separatorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Single pass through entities to detect separator
  for (const entity of entities) {
    const title = entity.title || entity.name;
    
    // Check for spaced separator first (more specific)
    if (title.includes(' / ')) {
      const result = ' / ';
      manageCacheSize(separatorCache, MAX_CACHE_SIZE);
      separatorCache.set(cacheKey, result);
      return result;
    }
    
    // Check for slash separator
    if (title.includes('/')) {
      const result = '/';
      manageCacheSize(separatorCache, MAX_CACHE_SIZE);
      separatorCache.set(cacheKey, result);
      return result;
    }
  }
  
  const defaultResult = ' / '; // Default to spaced separator
  manageCacheSize(separatorCache, MAX_CACHE_SIZE);
  separatorCache.set(cacheKey, defaultResult);
  return defaultResult;
}

/**
 * Build a hierarchical tree structure from flat taxonomy entities using title-based hierarchy
 * Foreman sends title data with hierarchy already built in (e.g., "Parent/Child" or "Parent / Child")
 */
export function buildTaxonomyTree<T extends TaxonomyEntity>(
  entities: T[],
  parentTitle?: string
): TaxonomyTreeNode<T>[] {
  // Auto-detect the separator used in this dataset
  const separator = detectHierarchySeparator(entities);
  
  const children = entities.filter(entity => {
    const entityTitle = entity.title || entity.name;
    
    if (!parentTitle) {
      // Root level entities - those that don't contain hierarchy separator
      return !entityTitle.includes(separator);
    }
    
    // Child entities - those whose title starts with parent title + separator
    return entityTitle.startsWith(`${parentTitle}${separator}`) && 
           entityTitle.split(separator).length === parentTitle.split(separator).length + 1;
  });

  return children.map(entity => {
    const entityTitle = entity.title || entity.name;
    const childNodes = buildTaxonomyTree(entities, entityTitle);
    return {
      entity,
      children: childNodes,
      level: getEntityLevelFromTitle(entity.title, separator),
      expanded: false,
      selected: false,
      disabled: false
    };
  });
}

/**
 * Get entity level from title hierarchy
 * Title format: "Parent/Child/Grandchild" or "Parent / Child / Grandchild"
 */
function getEntityLevelFromTitle(title?: string, separator: string = ' / '): number {
  if (!title) return 0;
  return title.split(separator).length - 1;
}

/**
 * Find a node in the tree by entity ID
 */
export function findNodeInTree<T extends TaxonomyEntity>(
  tree: TaxonomyTreeNode<T>[],
  entityId: number
): TaxonomyTreeNode<T> | null {
  for (const node of tree) {
    if (node.entity.id === entityId) {
      return node;
    }
    
    const found = findNodeInTree(node.children, entityId);
    if (found) {
      return found;
    }
  }
  
  return null;
}

/**
 * Flatten a tree structure into a flat array
 */
export function flattenTaxonomyTree<T extends TaxonomyEntity>(
  tree: TaxonomyTreeNode<T>[],
  includeCollapsed = false
): TaxonomyTreeNode<T>[] {
  const result: TaxonomyTreeNode<T>[] = [];
  
  const traverse = (nodes: TaxonomyTreeNode<T>[]) => {
    for (const node of nodes) {
      result.push(node);
      
      if (node.expanded || includeCollapsed) {
        traverse(node.children);
      }
    }
  };
  
  traverse(tree);
  return result;
}

/**
 * Get all parent entities for a given entity using title-based hierarchy
 */
export function getTaxonomyAncestors<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[]
): T[] {
  const ancestors: T[] = [];
  const entityTitle = entity.title || entity.name;
  const separator = detectHierarchySeparator(allEntities);
  
  if (!entityTitle.includes(separator)) return [];

  // Split title and build ancestor paths
  const titleParts = entityTitle.split(separator);
  let currentPath = '';
  
  // Build each ancestor path (excluding the current entity)
  for (let i = 0; i < titleParts.length - 1; i++) {
    if (i === 0) {
      currentPath = titleParts[i];
    } else {
      currentPath += `${separator}${titleParts[i]}`;
    }
    
    const ancestor = allEntities.find(e => (e.title || e.name) === currentPath);
    if (ancestor) {
      ancestors.push(ancestor);
    }
  }

  return ancestors;
}

/**
 * Get all descendant entities for a given entity using title-based hierarchy
 */
export function getTaxonomyDescendants<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[]
): T[] {
  const descendants: T[] = [];
  const entityTitle = entity.title || entity.name;
  const separator = detectHierarchySeparator(allEntities);
  
  allEntities.forEach(e => {
    const eTitle = e.title || e.name;
    // Check if entity title starts with parent title followed by hierarchy separator
    if (eTitle.startsWith(`${entityTitle}${separator}`)) {
      descendants.push(e);
    }
  });

  return descendants;
}

/**
 * Generate breadcrumbs for a taxonomy entity using title-based hierarchy
 */
export function getTaxonomyBreadcrumbs<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[],
  type: 'organization' | 'location'
): Array<{ id: number; name: string; path: string }> {
  const breadcrumbs: Array<{ id: number; name: string; path: string }> = [];
  const separator = detectHierarchySeparator(allEntities);
  
  if (!entity.title) {
    breadcrumbs.push({
      id: entity.id,
      name: entity.name,
      path: `/${type}s/${entity.id}`
    });
    return breadcrumbs;
  }

  // Split the title by hierarchy separator and build breadcrumbs
  const titleParts = entity.title.split(separator);
  
  // For each title part, try to find the corresponding entity
  let currentPath = '';
  titleParts.forEach((titlePart, index) => {
    if (index === 0) {
      currentPath = titlePart;
    } else {
      currentPath += `${separator}${titlePart}`;
    }
    
    // Find entity with this exact title path
    const matchingEntity = allEntities.find(e => e.title === currentPath);
    if (matchingEntity) {
      breadcrumbs.push({
        id: matchingEntity.id,
        name: matchingEntity.name,
        path: `/${type}s/${matchingEntity.id}`
      });
    } else if (index === titleParts.length - 1) {
      // If this is the current entity and we couldn't find it in the list
      breadcrumbs.push({
        id: entity.id,
        name: entity.name,
        path: `/${type}s/${entity.id}`
      });
    }
  });

  return breadcrumbs;
}

/**
 * Filter taxonomy entities by search query
 */
export function filterTaxonomyEntities<T extends TaxonomyEntity>(
  entities: T[],
  query: string,
  fields: (keyof T)[] = ['name', 'title', 'description']
): T[] {
  if (!query.trim()) {
    return entities;
  }
  
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return entities.filter(entity => {
    const searchableText = fields
      .map(field => entity[field])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
      
    return searchTerms.every(term => searchableText.includes(term));
  });
}

/**
 * Sort taxonomy entities by hierarchy and name
 */
export function sortTaxonomyEntities<T extends TaxonomyEntity>(
  entities: T[]
): T[] {
  // Build tree and then flatten to get hierarchical order
  const tree = buildTaxonomyTree(entities);
  const flattened = flattenTaxonomyTree(tree, true);
  return flattened.map(node => node.entity);
}

/**
 * Get entity display name (prefers title over name)
 */
export function getTaxonomyDisplayName(entity: TaxonomyEntity): string {
  return entity.title || entity.name;
}

/**
 * Check if an entity has children using title-based hierarchy
 */
export function hasChildren<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[]
): boolean {
  const entityTitle = entity.title || entity.name;
  const separator = detectHierarchySeparator(allEntities);
  return allEntities.some(e => {
    const eTitle = e.title || e.name;
    return eTitle.startsWith(`${entityTitle}${separator}`);
  });
}

/**
 * Calculate entity depth in hierarchy using title-based approach
 */
export function getTaxonomyDepth<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[]
): number {
  const separator = detectHierarchySeparator(allEntities);
  return getEntityLevelFromTitle(entity.title, separator);
}

/**
 * Validate taxonomy selection
 */
export function validateTaxonomySelection(
  selection: { organizationId?: number; locationId?: number },
  availableOrganizations: { id: number; name: string; organizations?: { id: number }[] }[],
  availableLocations: { id: number; name: string; organizations?: { id: number }[] }[]
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate organization
  if (selection.organizationId) {
    const org = availableOrganizations.find(o => o.id === selection.organizationId);
    if (!org) {
      errors.push('Selected organization is not available or does not exist');
    }
  }

  // Validate location
  if (selection.locationId) {
    const loc = availableLocations.find(l => l.id === selection.locationId);
    if (!loc) {
      errors.push('Selected location is not available or does not exist');
    }
  }

  // Check if location is compatible with organization
  if (selection.organizationId && selection.locationId) {
    const location = availableLocations.find(l => l.id === selection.locationId);
    if (location?.organizations && location.organizations.length > 0) {
      const isCompatible = location.organizations.some(org => org.id === selection.organizationId);
      if (!isCompatible) {
        warnings.push('Selected location may not be available in the selected organization');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate taxonomy entity data
 */
export function validateTaxonomyEntity(
  entity: Partial<TaxonomyEntity>,
  existingEntities: TaxonomyEntity[] = []
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Name is required
  if (!entity.name?.trim()) {
    errors.push('Name is required');
  }
  
  // Name must be unique
  if (entity.name) {
    const nameExists = existingEntities.some(e => 
      e.id !== entity.id && e.name.toLowerCase() === entity.name!.toLowerCase()
    );
    if (nameExists) {
      errors.push('Name must be unique');
    }
  }
  
  // Name format validation (configurable regex pattern)
  // Default pattern allows: letters, numbers, spaces, hyphens, underscores, dots
  // This can be customized based on actual Foreman validation requirements
  const namePattern = /^[a-zA-Z0-9_\-\s.]+$/;
  if (entity.name && !namePattern.test(entity.name)) {
    errors.push('Name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, and dots are allowed');
  }
  
  // Additional Foreman-like validations
  if (entity.name && entity.name.length > 255) {
    errors.push('Name must be 255 characters or less');
  }
  
  if (entity.name && entity.name.trim() !== entity.name) {
    errors.push('Name cannot start or end with whitespace');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Transform API response to simplified format
 */
export function transformTaxonomyApiResponse<T>(
  response: TaxonomyApiResponse<T>
): { data: T; meta: { total: number; page: number; perPage: number; canCreate: boolean } } {
  return {
    data: response.results,
    meta: {
      total: response.total,
      page: response.page,
      perPage: response.per_page,
      canCreate: response.can_create ?? false
    }
  };
}

/**
 * Extract taxonomy IDs from entities
 */
export function extractTaxonomyIds<T extends TaxonomyEntity>(entities: T[]): number[] {
  return entities.map(entity => entity.id);
}

/**
 * Find common parent for multiple entities using title-based hierarchy
 */
export function findCommonParent<T extends TaxonomyEntity>(
  entities: T[],
  allEntities: T[]
): T | null {
  if (entities.length === 0) return null;
  if (entities.length === 1) return entities[0];
  
  // Get ancestors for each entity
  const ancestorPaths = entities.map(entity => 
    getTaxonomyAncestors(entity, allEntities)
  );
  
  // Find common prefix in ancestor paths
  let commonAncestors: T[] = [];
  const shortestPath = Math.min(...ancestorPaths.map(path => path.length));
  
  for (let i = 0; i < shortestPath; i++) {
    const ancestorId = ancestorPaths[0][i].id;
    const isCommon = ancestorPaths.every(path => path[i].id === ancestorId);
    
    if (isCommon) {
      commonAncestors.push(ancestorPaths[0][i]);
    } else {
      break;
    }
  }
  
  return commonAncestors.length > 0 ? commonAncestors[commonAncestors.length - 1] : null;
}