// Core entity types
export interface User {
  id: number;
  login: string;
  firstname?: string;
  lastname?: string;
  mail?: string;
  admin: boolean;
  disabled: boolean;
  last_login_on?: string;
  auth_source_id: number;
  roles: Role[];
  organizations: Organization[];
  locations: Location[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  builtin: boolean;
  origin?: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  resource_type?: string;
}

export interface Host {
  id: number;
  name: string;
  ip?: string;
  ip6?: string;
  mac?: string;
  domain_id?: number;
  domain_name?: string;
  architecture_id?: number;
  architecture_name?: string;
  operatingsystem_id?: number;
  operatingsystem_name?: string;
  subnet_id?: number;
  subnet_name?: string;
  build: boolean;
  comment?: string;
  last_compile?: string;
  last_freshcheck?: string;
  last_report?: string;
  uptime_seconds?: number;
  enabled: boolean;
  managed: boolean;
  use_image?: boolean;
  image_file?: string;
  uuid?: string;
  compute_resource_id?: number;
  compute_resource_name?: string;
  compute_profile_id?: number;
  compute_profile_name?: string;
  capabilities: string[];
  provision_method?: string;
  certname?: string;
  image_id?: number;
  created_at: string;
  updated_at: string;
  owner_id?: number;
  owner_type?: string;
  owner_name?: string;
  hostgroup_id?: number;
  hostgroup_name?: string;
  environment_id?: number;
  environment_name?: string;
  puppet_proxy_id?: number;
  puppet_ca_proxy_id?: number;
  puppet_proxy_name?: string;
  puppet_ca_proxy_name?: string;
  organization_id?: number;
  organization_name?: string;
  location_id?: number;
  location_name?: string;
}

export interface Organization {
  id: number;
  name: string;
  title?: string;
  description?: string;
  ancestry?: string;
  label?: string;
}

export interface Location {
  id: number;
  name: string;
  title?: string;
  description?: string;
  ancestry?: string;
}

// API Response types
export interface ApiResponse<T> {
  total: number;
  subtotal: number;
  page: number;
  per_page: number;
  search?: string;
  sort?: {
    by: string;
    order: string;
  };
  results: T[];
}

export interface ApiError {
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface AxiosErrorResponse {
  response?: {
    status: number;
    statusText: string;
    data: {
      error?: {
        message?: string;
        full_messages?: string[];
      };
    };
  };
  message: string;
  code?: string;
  config?: {
    url?: string;
    method?: string;
  };
}

// Authentication types
export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenResponse {
  id: number;
  token_value: string;
  token?: string;
  name: string;
  active: boolean;
  expires_at?: string;
  scopes?: string[];
  personal_access_token?: {
    token_value: string;
    token?: string;
  };
  data?: {
    token_value: string;
    token?: string;
  };
}

// Search and pagination types
export interface SearchParams extends Record<string, unknown> {
  search?: string;
  page?: number;
  per_page?: number;
  order?: string;
}

export interface HostSearchParams extends SearchParams {
  organization_id?: number;
  location_id?: number;
}

// Host status types
export interface HostStatus {
  status: number;
  reported_at?: string;
}

export interface HostGlobalStatus extends HostStatus {
  global_status: number;
}

// Form types
export interface HostFormData {
  name: string;
  domain_id?: number;
  architecture_id?: number;
  operatingsystem_id?: number;
  hostgroup_id?: number;
  organization_id?: number;
  location_id?: number;
  comment?: string;
  build?: boolean;
  enabled?: boolean;
  managed?: boolean;
}

export interface UserFormData {
  login: string;
  firstname?: string;
  lastname?: string;
  mail?: string;
  password?: string;
  password_confirmation?: string;
  admin?: boolean;
  role_ids?: number[];
  organization_ids?: number[];
  location_ids?: number[];
}

// Host registration types
export interface RegistrationParams {
  hostgroup_id?: number;
  smart_proxy_id?: number;
  organization_id?: number;
  location_id?: number;
  insecure?: boolean;
}

export interface GeneratedRegistrationCommand {
  script: string; // The actual script content from Foreman
  parameters: RegistrationParams;
}

// Bulk action types
export interface BulkActionParameter {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  placeholder?: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType | string;
  action: (selectedItems: number[], parameters?: Record<string, unknown>) => Promise<BulkOperationResult>;
  permissions?: string[];
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  destructive?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  parameters?: BulkActionParameter[];
}

export interface BulkOperationResult {
  success_count: number;
  failed_count: number;
  errors?: Array<{
    item_id: number;
    item_name?: string;
    message: string;
  }>;
  warnings?: string[];
  task_id?: string; // For async operations
  message?: string; // Success/info message
  missed_items?: number[]; // IDs of items that couldn't be processed
  is_async?: boolean; // Whether operation runs in background
}

// Progress tracking for bulk operations
export interface BulkOperationProgress {
  operation_id: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  current_status: string;
  estimated_completion?: string;
}

// Host Groups types
export interface HostGroup {
  id: number;
  name: string;
  title: string;
  description?: string;
  puppet_class_ids?: number[];
  environment_id?: number;
  operatingsystem_id?: number;
  architecture_id?: number;
  medium_id?: number;
  ptable_id?: number;
  realm_id?: number;
  subnet_id?: number;
  domain_id?: number;
  ancestry?: string;
  parent_id?: number;
  parent_name?: string;
}

// Smart Proxies types
export interface SmartProxy {
  id: number;
  name: string;
  url: string;
  features?: Feature[];
  version?: string;
  expired_logs?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Feature {
  id: number;
  name: string;
}

// Taxonomy types
export * from './taxonomy';

// Export generated API types when available
// Note: Run 'yarn generate-types' to create generated/api.ts
// For now, we'll use a conditional export
export * from './generated';