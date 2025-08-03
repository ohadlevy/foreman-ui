import { createDefaultClient } from './client';

export interface ForemanPing {
  status: string;
  version: string;
  api_version: number;
  satellite?: boolean;
}

export interface ForemanStatusItem {
  status: string;
  label: string;
  description?: string;
}

export interface ForemanStatuses {
  [key: string]: ForemanStatusItem;
}

export const fetchForemanPing = async (): Promise<ForemanPing> => {
  const client = createDefaultClient();
  return client.get<ForemanPing>('/ping');
};

export const fetchForemanStatuses = async (): Promise<ForemanStatuses> => {
  const client = createDefaultClient();
  return client.get<ForemanStatuses>('/statuses');
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