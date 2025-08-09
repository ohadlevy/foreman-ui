import { createDefaultClient } from './client';

// Common interface structures for Foreman status responses
export interface DatabaseStatus {
  active: boolean;
  duration_ms: number;
}

export interface CacheServerStatus {
  status: string;
  duration_ms: number;
}

export interface CacheStatus {
  servers: Array<CacheServerStatus>;
}

// Comprehensive interface for detailed Foreman status information
export interface ForemanStatusDetails {
  version: string;
  api: {
    version: string;
    status?: string;
  };
  plugins: unknown[];
  smart_proxies: unknown[];
  compute_resources: unknown[];
  database: DatabaseStatus;
  cache: CacheStatus;
}

// Response from /ping endpoint (minimal status info)
export interface ForemanPingResponse {
  results: {
    foreman: {
      database: DatabaseStatus;
      cache: CacheStatus;
    };
  };
}

// Response from /statuses endpoint (comprehensive status info)
export interface ForemanStatusesResponse {
  results: {
    foreman: ForemanStatusDetails;
  };
}


export interface ForemanStatusItem {
  status: string;
  label: string;
  description?: string;
}

export interface ApiStatusData {
  version: string;
  status?: string;
}

export const fetchForemanPing = async (): Promise<ForemanPingResponse> => {
  const client = createDefaultClient();
  return client.get<ForemanPingResponse>('/ping');
};

export const fetchForemanStatuses = async (): Promise<ForemanStatusesResponse> => {
  const client = createDefaultClient();
  return client.get<ForemanStatusesResponse>('/statuses');
};

// Legacy status endpoint (deprecated, use ping instead)
export interface ForemanStatus {
  version: string;
  api_version: number;
  satellite?: boolean;
}

export const fetchForemanStatus = async (): Promise<ForemanStatus> => {
  const client = createDefaultClient();
  return client.get<ForemanStatus>('/status');
};