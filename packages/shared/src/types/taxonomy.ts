/**
 * Taxonomy types for Foreman organizations and locations
 * Provides enhanced typing for taxonomy selection, context management, and API integration
 */

import { Organization, Location, SearchParams } from './index';

/**
 * Base taxonomy entity interface
 */
export interface TaxonomyEntity {
  id: number;
  name: string;
  title?: string;
  description?: string;
}

/**
 * Enhanced Organization interface with additional metadata
 */
export interface EnhancedOrganization extends Organization {
  parent_id?: number;
  parent_name?: string;
  children?: EnhancedOrganization[];
  hosts_count?: number;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Enhanced Location interface with additional metadata
 */
export interface EnhancedLocation extends Location {
  parent_id?: number;
  parent_name?: string;
  children?: EnhancedLocation[];
  hosts_count?: number;
  users_count?: number;
  organizations?: Organization[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Taxonomy context - tracks current user's selected organization and location
 */
export interface TaxonomyContext {
  organization?: EnhancedOrganization;
  location?: EnhancedLocation;
  availableOrganizations: EnhancedOrganization[];
  availableLocations: EnhancedLocation[];
  isLoading: boolean;
  error?: string;
}

/**
 * Taxonomy selection state
 */
export interface TaxonomySelection {
  organizationId?: number;
  locationId?: number;
}

/**
 * Taxonomy permissions interface
 */
export interface TaxonomyPermissions {
  canViewOrganizations: boolean;
  canEditOrganizations: boolean;
  canCreateOrganizations: boolean;
  canDeleteOrganizations: boolean;
  canViewLocations: boolean;
  canEditLocations: boolean;
  canCreateLocations: boolean;
  canDeleteLocations: boolean;
  canSwitchContext: boolean;
}

/**
 * Taxonomy filter options for API requests
 */
export interface TaxonomyFilter {
  organization_id?: number;
  location_id?: number;
  include_nested?: boolean;
}

/**
 * Taxonomy tree node for hierarchical display
 */
export interface TaxonomyTreeNode<T extends TaxonomyEntity = TaxonomyEntity> {
  entity: T;
  children: TaxonomyTreeNode<T>[];
  level: number;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

/**
 * Taxonomy validation result
 */
export interface TaxonomyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Taxonomy scope for API resources
 */
export interface TaxonomyScope {
  organizations?: number[];
  locations?: number[];
  inherit_parent?: boolean;
}

/**
 * User's taxonomy assignments
 */
export interface UserTaxonomyAssignments {
  organizations: Organization[];
  locations: Location[];
  default_organization?: Organization;
  default_location?: Location;
}

/**
 * Taxonomy form data for creating/editing
 */
export interface TaxonomyFormData {
  name: string;
  title?: string;
  description?: string;
  parent_id?: number;
  organization_ids?: number[];
  location_ids?: number[];
}

/**
 * Taxonomy statistics for dashboard display
 */
export interface TaxonomyStats {
  organizations: {
    total: number;
    active: number;
    with_hosts: number;
  };
  locations: {
    total: number;
    active: number;
    with_hosts: number;
  };
}

/**
 * Taxonomy breadcrumb item for navigation
 */
export interface TaxonomyBreadcrumb {
  id: number;
  name: string;
  path: string;
  type: 'organization' | 'location';
}

/**
 * Taxonomy change event data
 */
export interface TaxonomyChangeEvent {
  type: 'organization' | 'location' | 'both';
  previousOrganization?: EnhancedOrganization;
  newOrganization?: EnhancedOrganization;
  previousLocation?: EnhancedLocation;
  newLocation?: EnhancedLocation;
  timestamp: Date;
  userId?: number;
}

/**
 * Query parameters for taxonomy API requests
 */
export interface TaxonomyQueryParams extends SearchParams {
  include_hosts_count?: boolean;
  include_users_count?: boolean;
}

/**
 * API response wrapper for taxonomy endpoints
 */
export interface TaxonomyApiResponse<T> {
  results: T;
  total: number;
  subtotal: number;
  page: number;
  per_page: number;
  search?: string;
  sort?: {
    by: string;
    order: string;
  };
  can_create?: boolean;
}

/**
 * Organization creation data
 */
export interface OrganizationCreateData {
  name: string;
  title?: string;
  description?: string;
  parent_id?: number;
  location_ids?: number[];
  compute_resource_ids?: number[];
  medium_ids?: number[];
  user_ids?: number[];
  smart_proxy_ids?: number[];
  subnet_ids?: number[];
  domain_ids?: number[];
  environment_ids?: number[];
  hostgroup_ids?: number[];
  realm_ids?: number[];
}

/**
 * Organization update data
 */
export type OrganizationUpdateData = Partial<OrganizationCreateData>;

/**
 * Location creation data
 */
export interface LocationCreateData {
  name: string;
  title?: string;
  description?: string;
  parent_id?: number;
  organization_ids?: number[];
  compute_resource_ids?: number[];
  medium_ids?: number[];
  user_ids?: number[];
  smart_proxy_ids?: number[];
  subnet_ids?: number[];
  domain_ids?: number[];
  environment_ids?: number[];
  hostgroup_ids?: number[];
  realm_ids?: number[];
}

/**
 * Location update data
 */
export type LocationUpdateData = Partial<LocationCreateData>;

/**
 * Taxonomy API error response
 */
export interface TaxonomyApiError {
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
  status: number;
}