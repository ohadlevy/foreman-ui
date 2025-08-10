/**
 * Taxonomy constants for organizations and locations
 * Defines default values, configuration, and API endpoints
 */

/**
 * Default taxonomy configuration
 */
export const TAXONOMY_CONFIG = {
  /**
   * Maximum hierarchy depth for organizations and locations
   */
  MAX_HIERARCHY_DEPTH: 10,

  /**
   * Default page size for taxonomy API requests
   */
  DEFAULT_PAGE_SIZE: 100,

  /**
   * Cache duration for taxonomy data (in milliseconds)
   */
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  /**
   * Minimum search term length for filtering
   */
  MIN_SEARCH_LENGTH: 2,

  /**
   * Default selection text when no taxonomy is selected
   */
  NO_SELECTION_TEXT: {
    ORGANIZATION: 'All Organizations',
    LOCATION: 'All Locations'
  },

  /**
   * Animation duration for taxonomy tree expansion (in milliseconds)
   */
  TREE_ANIMATION_DURATION: 200
} as const;

/**
 * Taxonomy API endpoints
 */
export const TAXONOMY_ENDPOINTS = {
  ORGANIZATIONS: '/organizations',
  LOCATIONS: '/locations',
  ORGANIZATION_DETAIL: (id: number) => `/organizations/${id}`,
  LOCATION_DETAIL: (id: number) => `/locations/${id}`,
  USER_ORGANIZATIONS: '/users/current/organizations',
  USER_LOCATIONS: '/users/current/locations',
  TAXONOMY_STATS: '/taxonomy/stats'
} as const;

/**
 * Taxonomy permissions required for various operations
 */
export const TAXONOMY_PERMISSIONS = {
  ORGANIZATION: {
    VIEW: 'view_organizations',
    EDIT: 'edit_organizations',
    CREATE: 'create_organizations',
    DELETE: 'destroy_organizations',
    ASSIGN: 'assign_organizations'
  },
  LOCATION: {
    VIEW: 'view_locations',
    EDIT: 'edit_locations',
    CREATE: 'create_locations',
    DELETE: 'destroy_locations',
    ASSIGN: 'assign_locations'
  }
} as const;

/**
 * Local storage keys for taxonomy preferences
 */
export const TAXONOMY_STORAGE_KEYS = {
  SELECTED_ORGANIZATION: 'foreman_selected_organization',
  SELECTED_LOCATION: 'foreman_selected_location',
  ORGANIZATION_TREE_STATE: 'foreman_org_tree_state',
  LOCATION_TREE_STATE: 'foreman_loc_tree_state',
  TAXONOMY_PREFERENCES: 'foreman_taxonomy_preferences'
} as const;

/**
 * Taxonomy context change reasons
 */
export const TAXONOMY_CHANGE_REASONS = {
  USER_SELECTION: 'user_selection',
  URL_PARAMETER: 'url_parameter',
  DEFAULT_ASSIGNMENT: 'default_assignment',
  PERMISSION_CHANGE: 'permission_change',
  SESSION_RESTORE: 'session_restore',
  API_UPDATE: 'api_update'
} as const;

/**
 * Default taxonomy context state
 */
export const DEFAULT_TAXONOMY_CONTEXT = {
  organization: undefined,
  location: undefined,
  availableOrganizations: [],
  availableLocations: [],
  isLoading: false,
  error: undefined
} as const;

/**
 * Taxonomy error messages
 */
export const TAXONOMY_ERRORS = {
  LOAD_FAILED: 'Failed to load taxonomy data',
  ORGANIZATION_NOT_FOUND: 'Organization not found or not accessible',
  LOCATION_NOT_FOUND: 'Location not found or not accessible',
  INVALID_SELECTION: 'Invalid taxonomy selection',
  PERMISSION_DENIED: 'Permission denied for taxonomy operation',
  NETWORK_ERROR: 'Network error while loading taxonomy data',
  VALIDATION_FAILED: 'Taxonomy validation failed'
} as const;

/**
 * Query keys for React Query caching
 */
export const TAXONOMY_QUERY_KEYS = {
  ORGANIZATIONS: ['taxonomy', 'organizations'] as const,
  LOCATIONS: ['taxonomy', 'locations'] as const,
  ORGANIZATION_DETAIL: (id: number) => ['taxonomy', 'organization', id] as const,
  LOCATION_DETAIL: (id: number) => ['taxonomy', 'location', id] as const,
  USER_ASSIGNMENTS: ['taxonomy', 'user-assignments'] as const,
  CONTEXT: ['taxonomy', 'context'] as const,
  STATS: ['taxonomy', 'stats'] as const
} as const;

/**
 * Taxonomy form validation rules
 */
export const TAXONOMY_VALIDATION = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
    PATTERN: /^[a-zA-Z0-9\s\-_.]+$/,
    RESERVED_NAMES: ['admin', 'root', 'system', 'api', 'www']
  },
  TITLE: {
    MIN_LENGTH: 0,
    MAX_LENGTH: 255
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000
  }
} as const;

/**
 * Taxonomy selector component configuration
 */
export const TAXONOMY_SELECTOR_CONFIG = {
  /**
   * Maximum items to show in dropdown before scrolling
   */
  MAX_DROPDOWN_ITEMS: 10,

  /**
   * Debounce delay for search input (in milliseconds)
   */
  SEARCH_DEBOUNCE_DELAY: 300,

  /**
   * Show hierarchy levels in selector
   */
  SHOW_HIERARCHY: true,

  /**
   * Enable search functionality
   */
  ENABLE_SEARCH: true,

  /**
   * Show entity counts in selector
   */
  SHOW_COUNTS: false,

  /**
   * Enable keyboard navigation
   */
  ENABLE_KEYBOARD_NAV: true
} as const;

/**
 * Taxonomy tree component configuration
 */
export const TAXONOMY_TREE_CONFIG = {
  /**
   * Default expansion level
   */
  DEFAULT_EXPANSION_LEVEL: 2,

  /**
   * Show icons for different entity types
   */
  SHOW_ICONS: true,

  /**
   * Enable drag and drop (for admin users)
   */
  ENABLE_DRAG_DROP: false,

  /**
   * Show context menus
   */
  SHOW_CONTEXT_MENU: true,

  /**
   * Lazy load children nodes
   */
  LAZY_LOAD: false
} as const;

/**
 * CSS class names for taxonomy components
 */
export const TAXONOMY_CSS_CLASSES = {
  SELECTOR: 'taxonomy-selector',
  TREE: 'taxonomy-tree',
  BREADCRUMB: 'taxonomy-breadcrumb',
  CONTEXT_SWITCHER: 'taxonomy-context-switcher',
  HIERARCHY_ITEM: 'taxonomy-hierarchy-item',
  LOADING: 'taxonomy-loading',
  ERROR: 'taxonomy-error',
  EMPTY: 'taxonomy-empty'
} as const;