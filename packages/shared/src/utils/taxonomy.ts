/**
 * Taxonomy utility functions for organizations and locations
 * Provides helpers for hierarchy management, validation, and common operations
 */

import {
  TaxonomyEntity,
  EnhancedOrganization,
  EnhancedLocation,
  TaxonomyTreeNode,
  TaxonomyValidation,
  TaxonomyBreadcrumb,
  TaxonomySelection,
  TaxonomyContext
} from '../types/taxonomy';

/**
 * Build a hierarchical tree structure from flat taxonomy entities
 */
export function buildTaxonomyTree<T extends TaxonomyEntity>(
  entities: T[],
  parentTitle?: string
): TaxonomyTreeNode<T>[] {
  const children = entities.filter(entity => {
    const entityTitle = entity.title || entity.name;
    
    if (!parentTitle) {
      // Root level entities - those that don't contain hierarchy separator
      return !entityTitle.includes(' / ');
    }
    
    // Child entities - those whose title starts with parent title + separator
    return entityTitle.startsWith(`${parentTitle} / `) && 
           entityTitle.split(' / ').length === parentTitle.split(' / ').length + 1;
  });

  return children.map(entity => {
    const entityTitle = entity.title || entity.name;
    const childNodes = buildTaxonomyTree(entities, entityTitle);
    return {
      entity,
      children: childNodes,
      level: getEntityLevelFromTitle(entity.title),
      expanded: false,
      selected: false,
      disabled: false
    };
  });
}

/**
 * Get entity level from title hierarchy
 * Title format: "Parent / Child / Grandchild"
 */
export function getEntityLevelFromTitle(title?: string): number {
  if (!title) return 0;
  return title.split(' / ').length - 1;
}

/**
 * Generate breadcrumb trail for a taxonomy entity using title hierarchy
 */
export function generateTaxonomyBreadcrumbs<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[],
  type: 'organization' | 'location'
): TaxonomyBreadcrumb[] {
  const breadcrumbs: TaxonomyBreadcrumb[] = [];
  
  if (!entity.title) {
    breadcrumbs.push({
      id: entity.id,
      name: entity.name,
      path: `/${type}s/${entity.id}`,
      type
    });
    return breadcrumbs;
  }

  // Split the title by hierarchy separator and build breadcrumbs
  const titleParts = entity.title.split(' / ');
  
  // For each title part, try to find the corresponding entity
  let currentPath = '';
  titleParts.forEach((titlePart, index) => {
    if (index === 0) {
      currentPath = titlePart;
    } else {
      currentPath += ` / ${titlePart}`;
    }
    
    // Find entity with this exact title path
    const matchingEntity = allEntities.find(e => e.title === currentPath);
    if (matchingEntity) {
      breadcrumbs.push({
        id: matchingEntity.id,
        name: titlePart,
        path: `/${type}s/${matchingEntity.id}`,
        type
      });
    } else if (index === titleParts.length - 1) {
      // If this is the current entity and we couldn't find it in the list
      breadcrumbs.push({
        id: entity.id,
        name: titlePart,
        path: `/${type}s/${entity.id}`,
        type
      });
    }
  });

  return breadcrumbs;
}

/**
 * Find all descendants of a taxonomy entity using title hierarchy
 */
export function findDescendants<T extends TaxonomyEntity>(
  parentEntity: T,
  entities: T[]
): T[] {
  const descendants: T[] = [];
  const parentTitle = parentEntity.title || parentEntity.name;
  
  entities.forEach(entity => {
    const entityTitle = entity.title || entity.name;
    // Check if entity title starts with parent title followed by hierarchy separator
    if (entityTitle.startsWith(`${parentTitle} / `)) {
      descendants.push(entity);
    }
  });

  return descendants;
}

/**
 * Find all ancestors of a taxonomy entity using title hierarchy
 */
export function findAncestors<T extends TaxonomyEntity>(
  entity: T,
  allEntities: T[]
): T[] {
  const ancestors: T[] = [];
  const entityTitle = entity.title || entity.name;
  
  if (!entityTitle.includes(' / ')) return [];

  // Split title and build ancestor paths
  const titleParts = entityTitle.split(' / ');
  let currentPath = '';
  
  // Build each ancestor path (excluding the current entity)
  for (let i = 0; i < titleParts.length - 1; i++) {
    if (i === 0) {
      currentPath = titleParts[i];
    } else {
      currentPath += ` / ${titleParts[i]}`;
    }
    
    const ancestor = allEntities.find(e => (e.title || e.name) === currentPath);
    if (ancestor) {
      ancestors.push(ancestor);
    }
  }

  return ancestors;
}

/**
 * Validate taxonomy selection
 */
export function validateTaxonomySelection(
  selection: TaxonomySelection,
  availableOrganizations: EnhancedOrganization[],
  availableLocations: EnhancedLocation[]
): TaxonomyValidation {
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
 * Format taxonomy name with hierarchy indication
 */
export function formatTaxonomyName(entity: TaxonomyEntity, showHierarchy: boolean = false): string {
  if (!showHierarchy) {
    return entity.title || entity.name;
  }

  const level = getEntityLevelFromTitle(entity.title);
  const indent = '  '.repeat(level);
  
  // Extract just the last part of the title for display
  const displayName = entity.title?.split(' / ').pop() || entity.name;
  return `${indent}${displayName}`;
}

/**
 * Get taxonomy display path (e.g., "Parent / Child / Current")
 */
export function getTaxonomyPath<T extends TaxonomyEntity>(
  entity: T,
  _allEntities: T[]
): string {
  // The title already contains the full path, so just return it
  return entity.title || entity.name;
}

/**
 * Filter entities by search term
 */
export function filterTaxonomyEntities<T extends TaxonomyEntity>(
  entities: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return entities;

  const term = searchTerm.toLowerCase();
  return entities.filter(entity => 
    entity.name.toLowerCase().includes(term) ||
    entity.title?.toLowerCase().includes(term) ||
    entity.description?.toLowerCase().includes(term)
  );
}

/**
 * Sort taxonomy entities by name or hierarchy
 */
export function sortTaxonomyEntities<T extends TaxonomyEntity>(
  entities: T[],
  sortBy: 'name' | 'hierarchy' = 'name'
): T[] {
  if (sortBy === 'hierarchy') {
    return [...entities].sort((a, b) => {
      const aLevel = getEntityLevelFromTitle(a.title);
      const bLevel = getEntityLevelFromTitle(b.title);
      
      if (aLevel !== bLevel) {
        return aLevel - bLevel;
      }
      
      return (a.title || a.name).localeCompare(b.title || b.name);
    });
  }

  return [...entities].sort((a, b) => 
    (a.title || a.name).localeCompare(b.title || b.name)
  );
}

/**
 * Check if user can access a taxonomy entity based on their assignments
 */
export function canAccessTaxonomyEntity(
  entityId: number,
  entityType: 'organization' | 'location',
  userAssignments: { organizations: number[]; locations: number[] }
): boolean {
  if (entityType === 'organization') {
    return userAssignments.organizations.includes(entityId);
  }
  return userAssignments.locations.includes(entityId);
}

/**
 * Get default taxonomy selection for a user
 */
export function getDefaultTaxonomySelection(
  context: TaxonomyContext
): TaxonomySelection {
  return {
    organizationId: context.organization?.id,
    locationId: context.location?.id
  };
}

/**
 * Merge taxonomy selections, preferring new values over existing ones
 */
export function mergeTaxonomySelections(
  existing: TaxonomySelection,
  updates: Partial<TaxonomySelection>
): TaxonomySelection {
  return {
    organizationId: updates.organizationId ?? existing.organizationId,
    locationId: updates.locationId ?? existing.locationId
  };
}

/**
 * Create taxonomy URL parameters for API requests
 */
export function createTaxonomyParams(selection: TaxonomySelection): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (selection.organizationId) {
    params.organization_id = selection.organizationId.toString();
  }
  
  if (selection.locationId) {
    params.location_id = selection.locationId.toString();
  }
  
  return params;
}