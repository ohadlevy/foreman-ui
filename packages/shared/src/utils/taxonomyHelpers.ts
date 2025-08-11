import type {
  TaxonomyTreeNode,
  TaxonomyEntity,
  TaxonomyApiResponse
} from '../types/taxonomy';

/**
 * Constants for taxonomy hierarchy calculations
 */
const ROOT_LEVEL = 0;

/**
 * Precompute hierarchy levels for all entities to optimize tree building
 */
function precomputeHierarchyLevels<T extends TaxonomyEntity & { parent_id?: number }>(
  entities: T[]
): Map<number, number> {
  const levelMap = new Map<number, number>();
  const visited = new Set<number>();
  const inProgress = new Set<number>(); // Detect cycles during traversal

  const calculateLevel = (entityId: number): number => {
    // Check for existing computed level
    if (levelMap.has(entityId)) {
      return levelMap.get(entityId)!;
    }

    // Detect cycles
    if (inProgress.has(entityId)) {
      console.warn(`[taxonomyHelpers] Cycle detected in taxonomy hierarchy for entity ${entityId}. Treating as root level.`);
      return ROOT_LEVEL; // Treat cyclic nodes as root level
    }

    const entity = entities.find(e => e.id === entityId);
    if (!entity || !entity.parent_id) {
      levelMap.set(entityId, ROOT_LEVEL);
      return ROOT_LEVEL;
    }

    inProgress.add(entityId);
    const parentLevel = calculateLevel(entity.parent_id);
    inProgress.delete(entityId);

    const level = parentLevel + 1;
    levelMap.set(entityId, level);
    return level;
  };

  // Precompute levels for all entities
  entities.forEach(entity => {
    if (!visited.has(entity.id)) {
      calculateLevel(entity.id);
      visited.add(entity.id);
    }
  });

  return levelMap;
}

/**
 * Build a hierarchical tree structure from flat taxonomy data
 * Optimized with precomputed hierarchy levels
 */
export function buildTaxonomyTree<T extends TaxonomyEntity & { parent_id?: number }>(
  entities: T[]
): TaxonomyTreeNode<T>[] {
  const nodeMap = new Map<number, TaxonomyTreeNode<T>>();
  const tree: TaxonomyTreeNode<T>[] = [];
  const visited = new Set<number>(); // Prevent circular references
  
  // Precompute all hierarchy levels for optimal performance
  const levelMap = precomputeHierarchyLevels(entities);

  // Create all nodes with precomputed levels
  entities.forEach(entity => {
    const node: TaxonomyTreeNode<T> = {
      entity,
      children: [],
      level: levelMap.get(entity.id) || ROOT_LEVEL,
      expanded: false,
      selected: false,
      disabled: false
    };
    nodeMap.set(entity.id, node);
  });

  // Build parent-child relationships using O(1) map lookups
  entities.forEach(entity => {
    const node = nodeMap.get(entity.id);
    if (!node) return;

    if (!entity.parent_id) {
      // Root level entity
      tree.push(node);
    } else {
      // Find parent using map lookup (O(1))
      const parentNode = nodeMap.get(entity.parent_id);
      if (parentNode && !visited.has(entity.id)) {
        // Add to parent's children (level already computed)
        parentNode.children.push(node);
        visited.add(entity.id);
      } else {
        // Parent not found or circular reference, treat as root
        tree.push(node);
      }
    }
  });

  return tree;
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
 * Get all parent entities for a given entity
 */
export function getTaxonomyAncestors<T extends TaxonomyEntity & { parent_id?: number }>(
  entity: T,
  allEntities: T[]
): T[] {
  const ancestors: T[] = [];
  const entityMap = new Map(allEntities.map(e => [e.id, e]));
  const visited = new Set<number>(); // Prevent circular references
  const maxDepth = 50; // Prevent extremely deep hierarchies
  
  let current = entity;
  let depth = 0;
  
  while (current.parent_id && depth < maxDepth) {
    // Check for circular reference
    if (visited.has(current.id)) {
      console.warn(`Circular reference detected in taxonomy hierarchy at entity ${current.id}`);
      break;
    }
    
    visited.add(current.id);
    const parent = entityMap.get(current.parent_id);
    
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
      depth++;
    } else {
      break;
    }
  }
  
  if (depth >= maxDepth) {
    console.warn(`Maximum hierarchy depth (${maxDepth}) reached for entity ${entity.id}`);
  }
  
  return ancestors;
}

/**
 * Get all descendant entities for a given entity
 */
export function getTaxonomyDescendants<T extends TaxonomyEntity & { parent_id?: number }>(
  entity: T,
  allEntities: T[]
): T[] {
  const descendants: T[] = [];
  
  const findChildren = (parentId: number) => {
    const children = allEntities.filter(e => e.parent_id === parentId);
    for (const child of children) {
      descendants.push(child);
      findChildren(child.id);
    }
  };
  
  findChildren(entity.id);
  return descendants;
}

/**
 * Generate breadcrumbs for a taxonomy entity
 */
export function getTaxonomyBreadcrumbs<T extends TaxonomyEntity & { parent_id?: number }>(
  entity: T,
  allEntities: T[],
  type: 'organization' | 'location'
): Array<{ id: number; name: string; path: string }> {
  const ancestors = getTaxonomyAncestors(entity, allEntities);
  const breadcrumbs = ancestors.map(ancestor => ({
    id: ancestor.id,
    name: ancestor.name,
    path: `/${type}s/${ancestor.id}`
  }));
  
  // Add current entity
  breadcrumbs.push({
    id: entity.id,
    name: entity.name,
    path: `/${type}s/${entity.id}`
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
export function sortTaxonomyEntities<T extends TaxonomyEntity & { parent_id?: number }>(
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
 * Check if an entity has children
 */
export function hasChildren<T extends TaxonomyEntity & { parent_id?: number }>(
  entity: T,
  allEntities: T[]
): boolean {
  return allEntities.some(e => e.parent_id === entity.id);
}

/**
 * Calculate entity depth in hierarchy
 */
export function getTaxonomyDepth<T extends TaxonomyEntity & { parent_id?: number }>(
  entity: T,
  allEntities: T[]
): number {
  const ancestors = getTaxonomyAncestors(entity, allEntities);
  return ancestors.length;
}

/**
 * Group entities by parent
 */
export function groupTaxonomyByParent<T extends TaxonomyEntity & { parent_id?: number }>(
  entities: T[]
): Map<number | null, T[]> {
  const groups = new Map<number | null, T[]>();
  
  entities.forEach(entity => {
    const parentId = entity.parent_id || null;
    if (!groups.has(parentId)) {
      groups.set(parentId, []);
    }
    groups.get(parentId)!.push(entity);
  });
  
  return groups;
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
 * Find common parent for multiple entities
 */
export function findCommonParent<T extends TaxonomyEntity & { parent_id?: number }>(
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