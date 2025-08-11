import { describe, it, expect } from 'vitest';
import {
  buildTaxonomyTree,
  findNodeInTree,
  flattenTaxonomyTree,
  getTaxonomyAncestors,
  getTaxonomyDescendants,
  getTaxonomyBreadcrumbs,
  filterTaxonomyEntities,
  sortTaxonomyEntities,
  getTaxonomyDisplayName,
  hasChildren,
  getTaxonomyDepth,
  groupTaxonomyByParent,
  validateTaxonomyEntity,
  transformTaxonomyApiResponse,
  extractTaxonomyIds,
  findCommonParent
} from '../taxonomyHelpers';
import type { EnhancedOrganization, TaxonomyApiResponse } from '../../types/taxonomy';

// Mock data
const mockOrganizations: EnhancedOrganization[] = [
  { id: 1, name: 'root1', title: 'Root Organization 1' },
  { id: 2, name: 'child1', title: 'Child Organization 1', parent_id: 1 },
  { id: 3, name: 'child2', title: 'Child Organization 2', parent_id: 1 },
  { id: 4, name: 'grandchild1', title: 'Grandchild Organization 1', parent_id: 2 },
  { id: 5, name: 'root2', title: 'Root Organization 2' }
];

describe('buildTaxonomyTree', () => {
  it('should build a hierarchical tree from flat data', () => {
    const tree = buildTaxonomyTree(mockOrganizations);

    expect(tree).toHaveLength(2); // Two root nodes
    expect(tree[0].entity.id).toBe(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].entity.id).toBe(2);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].entity.id).toBe(4);
    expect(tree[1].entity.id).toBe(5);
    expect(tree[1].children).toHaveLength(0);
  });

  it('should set correct levels in the tree', () => {
    const tree = buildTaxonomyTree(mockOrganizations);

    expect(tree[0].level).toBe(0); // Root
    expect(tree[0].children[0].level).toBe(1); // Child
    expect(tree[0].children[0].children[0].level).toBe(2); // Grandchild
  });
});

describe('findNodeInTree', () => {
  it('should find a node by entity ID', () => {
    const tree = buildTaxonomyTree(mockOrganizations);
    const node = findNodeInTree(tree, 4);

    expect(node).toBeTruthy();
    expect(node?.entity.id).toBe(4);
    expect(node?.entity.name).toBe('grandchild1');
  });

  it('should return null for non-existent ID', () => {
    const tree = buildTaxonomyTree(mockOrganizations);
    const node = findNodeInTree(tree, 999);

    expect(node).toBeNull();
  });
});

describe('flattenTaxonomyTree', () => {
  it('should flatten expanded tree structure', () => {
    const tree = buildTaxonomyTree(mockOrganizations);
    tree[0].expanded = true;
    tree[0].children[0].expanded = true;

    const flattened = flattenTaxonomyTree(tree);

    expect(flattened).toHaveLength(5); // All nodes since some are expanded
    expect(flattened[0].entity.id).toBe(1);
    expect(flattened[1].entity.id).toBe(2);
    expect(flattened[2].entity.id).toBe(4);
  });

  it('should include collapsed nodes when specified', () => {
    const tree = buildTaxonomyTree(mockOrganizations);

    const flattened = flattenTaxonomyTree(tree, true);

    expect(flattened).toHaveLength(5); // All nodes included
  });
});

describe('getTaxonomyAncestors', () => {
  it('should return all ancestors for an entity', () => {
    const grandchild = mockOrganizations.find(o => o.id === 4)!;
    const ancestors = getTaxonomyAncestors(grandchild, mockOrganizations);

    expect(ancestors).toHaveLength(2);
    expect(ancestors[0].id).toBe(1); // Root
    expect(ancestors[1].id).toBe(2); // Parent
  });

  it('should return empty array for root entity', () => {
    const root = mockOrganizations.find(o => o.id === 1)!;
    const ancestors = getTaxonomyAncestors(root, mockOrganizations);

    expect(ancestors).toHaveLength(0);
  });
});

describe('getTaxonomyDescendants', () => {
  it('should return all descendants for an entity', () => {
    const root = mockOrganizations.find(o => o.id === 1)!;
    const descendants = getTaxonomyDescendants(root, mockOrganizations);

    expect(descendants).toHaveLength(3);
    expect(descendants.map(d => d.id)).toEqual(expect.arrayContaining([2, 3, 4]));
  });

  it('should return empty array for leaf entity', () => {
    const leaf = mockOrganizations.find(o => o.id === 4)!;
    const descendants = getTaxonomyDescendants(leaf, mockOrganizations);

    expect(descendants).toHaveLength(0);
  });
});

describe('getTaxonomyBreadcrumbs', () => {
  it('should generate breadcrumbs for nested entity', () => {
    const grandchild = mockOrganizations.find(o => o.id === 4)!;
    const breadcrumbs = getTaxonomyBreadcrumbs(grandchild, mockOrganizations, 'organization');

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({ id: 1, name: 'root1', path: '/organizations/1' });
    expect(breadcrumbs[1]).toEqual({ id: 2, name: 'child1', path: '/organizations/2' });
    expect(breadcrumbs[2]).toEqual({ id: 4, name: 'grandchild1', path: '/organizations/4' });
  });
});

describe('filterTaxonomyEntities', () => {
  it('should filter entities by search query', () => {
    const filtered = filterTaxonomyEntities(mockOrganizations, 'child');

    expect(filtered).toHaveLength(3);
    expect(filtered.map(f => f.id)).toEqual([2, 3, 4]);
  });

  it('should handle multiple search terms', () => {
    const filtered = filterTaxonomyEntities(mockOrganizations, 'child organization');

    expect(filtered).toHaveLength(3);
  });

  it('should return all entities for empty query', () => {
    const filtered = filterTaxonomyEntities(mockOrganizations, '');

    expect(filtered).toHaveLength(mockOrganizations.length);
  });
});

describe('sortTaxonomyEntities', () => {
  it('should sort entities in hierarchical order', () => {
    const sorted = sortTaxonomyEntities(mockOrganizations);

    expect(sorted[0].id).toBe(1); // Root first
    expect(sorted[1].id).toBe(2); // Child
    expect(sorted[2].id).toBe(4); // Grandchild
    expect(sorted[3].id).toBe(3); // Other child
    expect(sorted[4].id).toBe(5); // Other root
  });
});

describe('getTaxonomyDisplayName', () => {
  it('should prefer title over name', () => {
    const entity = { id: 1, name: 'test', title: 'Test Title' };
    expect(getTaxonomyDisplayName(entity)).toBe('Test Title');
  });

  it('should use name when title is not available', () => {
    const entity = { id: 1, name: 'test' };
    expect(getTaxonomyDisplayName(entity)).toBe('test');
  });
});

describe('hasChildren', () => {
  it('should return true for entity with children', () => {
    const parent = mockOrganizations.find(o => o.id === 1)!;
    expect(hasChildren(parent, mockOrganizations)).toBe(true);
  });

  it('should return false for leaf entity', () => {
    const leaf = mockOrganizations.find(o => o.id === 4)!;
    expect(hasChildren(leaf, mockOrganizations)).toBe(false);
  });
});

describe('getTaxonomyDepth', () => {
  it('should return correct depth for nested entity', () => {
    const grandchild = mockOrganizations.find(o => o.id === 4)!;
    expect(getTaxonomyDepth(grandchild, mockOrganizations)).toBe(2);
  });

  it('should return 0 for root entity', () => {
    const root = mockOrganizations.find(o => o.id === 1)!;
    expect(getTaxonomyDepth(root, mockOrganizations)).toBe(0);
  });
});

describe('groupTaxonomyByParent', () => {
  it('should group entities by parent ID', () => {
    const groups = groupTaxonomyByParent(mockOrganizations);

    expect(groups.get(null)).toHaveLength(2); // Root entities
    expect(groups.get(1)).toHaveLength(2); // Children of entity 1
    expect(groups.get(2)).toHaveLength(1); // Children of entity 2
  });
});

describe('validateTaxonomyEntity', () => {
  it('should validate valid entity', () => {
    const entity = { name: 'test-entity', title: 'Test Entity' };
    const result = validateTaxonomyEntity(entity);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject entity without name', () => {
    const entity = { title: 'Test Entity' };
    const result = validateTaxonomyEntity(entity);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('should reject duplicate names', () => {
    const entity = { name: 'root1' };
    const result = validateTaxonomyEntity(entity, mockOrganizations);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name must be unique');
  });

  it('should reject invalid name format', () => {
    const entity = { name: 'test@entity' };
    const result = validateTaxonomyEntity(entity);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, and dots are allowed');
  });
});

describe('transformTaxonomyApiResponse', () => {
  it('should transform API response to simplified format', () => {
    const apiResponse: TaxonomyApiResponse<EnhancedOrganization[]> = {
      results: mockOrganizations,
      total: 5,
      subtotal: 5,
      page: 1,
      per_page: 100,
      can_create: true
    };

    const transformed = transformTaxonomyApiResponse(apiResponse);

    expect(transformed.data).toEqual(mockOrganizations);
    expect(transformed.meta).toEqual({
      total: 5,
      page: 1,
      perPage: 100,
      canCreate: true
    });
  });
});

describe('extractTaxonomyIds', () => {
  it('should extract IDs from entities', () => {
    const ids = extractTaxonomyIds(mockOrganizations);

    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('findCommonParent', () => {
  it('should find common parent for multiple entities', () => {
    const entities = [
      mockOrganizations.find(o => o.id === 2)!, // child1
      mockOrganizations.find(o => o.id === 3)!  // child2
    ];

    const commonParent = findCommonParent(entities, mockOrganizations);

    expect(commonParent?.id).toBe(1); // Both have parent ID 1
  });

  it('should return null when no common parent exists', () => {
    const entities = [
      mockOrganizations.find(o => o.id === 1)!, // root1
      mockOrganizations.find(o => o.id === 5)!  // root2
    ];

    const commonParent = findCommonParent(entities, mockOrganizations);

    expect(commonParent).toBeNull();
  });

  it('should return the entity itself for single entity', () => {
    const entities = [mockOrganizations.find(o => o.id === 1)!];

    const commonParent = findCommonParent(entities, mockOrganizations);

    expect(commonParent?.id).toBe(1);
  });
});