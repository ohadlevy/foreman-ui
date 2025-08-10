// API Constants
export const API_ENDPOINTS = {
  HOSTS: '/hosts',
  USERS: '/users',
  ROLES: '/roles',
  ORGANIZATIONS: '/organizations',
  LOCATIONS: '/locations',
  HOSTGROUPS: '/hostgroups',
  SMART_PROXIES: '/smart_proxies',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  GRAPHQL: '/api/graphql',
  REGISTRATION_COMMANDS: '/registration_commands',
} as const;

// Host status constants
export const HOST_STATUS = {
  OK: 0,
  WARNING: 1,
  CRITICAL: 2,
  UNKNOWN: 3,
} as const;

export const HOST_GLOBAL_STATUS = {
  OK: 0,
  WARNING: 1,
  ERROR: 2,
} as const;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'foreman_auth_token',
  USER_PREFERENCES: 'foreman_user_preferences',
  THEME: 'foreman_theme',
} as const;

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Role names
export const BUILTIN_ROLES = {
  ANONYMOUS: 'Anonymous',
  DEFAULT_USER: 'Default user',
  VIEWER: 'Viewer',
  SITE_MANAGER: 'Site manager',
  MANAGER: 'Manager',
  ADMIN: 'Administrator',
} as const;

// Permission resource types
export const RESOURCE_TYPES = {
  HOST: 'Host',
  USER: 'User',
  ROLE: 'Role',
  ORGANIZATION: 'Organization',
  LOCATION: 'Location',
  DASHBOARD: 'Dashboard',
} as const;

// Form validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HOSTNAME: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
} as const;

// Export branding constants
export * from './branding';