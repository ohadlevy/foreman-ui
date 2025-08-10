import { describe, it, expect } from 'vitest';
import {
  buildTaxonomyTree,
  getEntityLevelFromTitle,
  generateTaxonomyBreadcrumbs,
  findDescendants,
  findAncestors,
  validateTaxonomySelection,
  formatTaxonomyName,
  getTaxonomyPath,
  filterTaxonomyEntities,
  sortTaxonomyEntities,
  createTaxonomyParams
} from '../taxonomy';
import type {
  EnhancedOrganization,
  EnhancedLocation,
  TaxonomySelection
} from '../../types/taxonomy';

describe('taxonomy utils', () => {
  const mockOrganizations: EnhancedOrganization[] = [
    { id: 1, name: 'Root Org', title: 'Root Organization' },
    { id: 2, name: 'Child Org', title: 'Root Organization / Child Organization' },
    { id: 3, name: 'Grandchild Org', title: 'Root Organization / Child Organization / Grandchild Organization' }
  ];

  const mockLocations: EnhancedLocation[] = [
    { id: 1, name: 'Root Loc', title: 'Root Location' },
    { id: 2, name: 'Child Loc', title: 'Root Location / Child Location' }
  ];


  describe('getEntityLevelFromTitle', () => {
    it('should calculate entity level from title hierarchy', () => {
      expect(getEntityLevelFromTitle('Root Organization')).toBe(0);
      expect(getEntityLevelFromTitle('Root Organization / Child Organization')).toBe(1);
      expect(getEntityLevelFromTitle('Root Organization / Child Organization / Grandchild Organization')).toBe(2);
      expect(getEntityLevelFromTitle('')).toBe(0);
      expect(getEntityLevelFromTitle(undefined)).toBe(0);
    });
  });

  describe('buildTaxonomyTree', () => {
    it('should build hierarchical tree from flat entities', () => {
      const tree = buildTaxonomyTree(mockOrganizations);
      
      expect(tree).toHaveLength(1); // Only root organization
      expect(tree[0].entity.id).toBe(1);
      expect(tree[0].children).toHaveLength(1); // Child organization
      expect(tree[0].children[0].entity.id).toBe(2);
      expect(tree[0].children[0].children).toHaveLength(1); // Grandchild organization
      expect(tree[0].children[0].children[0].entity.id).toBe(3);
    });
  });

  describe('generateTaxonomyBreadcrumbs', () => {
    it('should generate breadcrumbs for nested entity', () => {
      const entity = mockOrganizations[2]; // Grandchild Org
      const breadcrumbs = generateTaxonomyBreadcrumbs(entity, mockOrganizations, 'organization');
      
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].name).toBe('Root Organization');
      expect(breadcrumbs[1].name).toBe('Child Organization');
      expect(breadcrumbs[2].name).toBe('Grandchild Organization');
    });

    it('should generate single breadcrumb for root entity', () => {
      const entity = mockOrganizations[0]; // Root Org
      const breadcrumbs = generateTaxonomyBreadcrumbs(entity, mockOrganizations, 'organization');
      
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].name).toBe('Root Organization');
    });
  });

  describe('findDescendants', () => {
    it('should find all descendants of an entity', () => {
      const rootOrg = mockOrganizations[0];
      const descendants = findDescendants(rootOrg, mockOrganizations);
      
      expect(descendants).toHaveLength(2);
      expect(descendants.map(d => d.id)).toEqual([2, 3]);
    });
  });

  describe('findAncestors', () => {
    it('should find all ancestors of an entity', () => {
      const entity = mockOrganizations[2]; // Grandchild Org
      const ancestors = findAncestors(entity, mockOrganizations);
      
      expect(ancestors).toHaveLength(2);
      expect(ancestors.map(a => a.id)).toEqual([1, 2]);
    });

    it('should return empty array for root entity', () => {
      const entity = mockOrganizations[0]; // Root Org
      const ancestors = findAncestors(entity, mockOrganizations);
      
      expect(ancestors).toHaveLength(0);
    });
  });

  describe('validateTaxonomySelection', () => {
    it('should validate valid selection', () => {
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 1
      };
      
      const result = validateTaxonomySelection(selection, mockOrganizations, mockLocations);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid organization', () => {
      const selection: TaxonomySelection = {
        organizationId: 999
      };
      
      const result = validateTaxonomySelection(selection, mockOrganizations, mockLocations);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Selected organization is not available or does not exist');
    });
  });

  describe('formatTaxonomyName', () => {
    it('should format name without hierarchy', () => {
      const entity = mockOrganizations[1];
      const formatted = formatTaxonomyName(entity, false);
      
      expect(formatted).toBe('Root Organization / Child Organization');
    });

    it('should format name with hierarchy indication', () => {
      const entity = mockOrganizations[2]; // Level 2
      const formatted = formatTaxonomyName(entity, true);
      
      expect(formatted).toBe('    Grandchild Organization'); // 2 levels = 4 spaces
    });
  });

  describe('getTaxonomyPath', () => {
    it('should generate full taxonomy path', () => {
      const entity = mockOrganizations[2]; // Grandchild Org
      const path = getTaxonomyPath(entity, mockOrganizations);
      
      expect(path).toBe('Root Organization / Child Organization / Grandchild Organization');
    });
  });

  describe('filterTaxonomyEntities', () => {
    it('should filter entities by search term', () => {
      const filtered = filterTaxonomyEntities(mockOrganizations, 'child');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.name)).toEqual(['Child Org', 'Grandchild Org']);
    });

    it('should return all entities for empty search', () => {
      const filtered = filterTaxonomyEntities(mockOrganizations, '');
      
      expect(filtered).toHaveLength(3);
    });
  });

  describe('sortTaxonomyEntities', () => {
    it('should sort by name', () => {
      const sorted = sortTaxonomyEntities(mockOrganizations, 'name');
      
      // Sorting is done by title, not name
      expect(sorted.map(e => e.title)).toEqual([
        'Root Organization',
        'Root Organization / Child Organization', 
        'Root Organization / Child Organization / Grandchild Organization'
      ]);
    });

    it('should sort by hierarchy', () => {
      const sorted = sortTaxonomyEntities(mockOrganizations, 'hierarchy');
      
      expect(sorted.map(e => e.name)).toEqual(['Root Org', 'Child Org', 'Grandchild Org']);
    });
  });

  describe('createTaxonomyParams', () => {
    it('should create URL parameters from selection', () => {
      const selection: TaxonomySelection = {
        organizationId: 1,
        locationId: 2
      };
      
      const params = createTaxonomyParams(selection);
      
      expect(params).toEqual({
        organization_id: '1',
        location_id: '2'
      });
    });

    it('should handle partial selection', () => {
      const selection: TaxonomySelection = {
        organizationId: 1
      };
      
      const params = createTaxonomyParams(selection);
      
      expect(params).toEqual({
        organization_id: '1'
      });
    });
  });
});