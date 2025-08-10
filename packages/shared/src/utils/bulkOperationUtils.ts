import { AxiosError } from 'axios';
import { BulkOperationResult } from '../types';

// Configuration constants
export const MAX_BULK_OPERATION_HOSTS = 1000;

export interface ParsedBulkOperationError {
  message: string;
  details?: string[];
  hostErrors?: Array<{
    hostId: number;
    hostName?: string;
    error: string;
  }>;
  statusCode?: number;
}

/**
 * Parse bulk operation error responses from Foreman API
 */
export const parseBulkOperationError = (error: unknown): ParsedBulkOperationError => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const axiosError = error;
    
    if (axiosError.response?.data?.error) {
      const errorData = axiosError.response.data.error;
      
      return {
        message: errorData.message || 'Bulk operation failed',
        details: errorData.full_messages || [],
        statusCode: axiosError.response.status,
      };
    }
    
    return {
      message: axiosError.message || 'Network error occurred',
      statusCode: axiosError.response?.status,
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
    };
  }
  
  return {
    message: 'An unknown error occurred during bulk operation',
  };
};

/**
 * Validate bulk operation result and ensure it has required fields
 */
export const validateBulkOperationResult = (result: unknown): BulkOperationResult => {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid bulk operation result: result is not an object');
  }
  
  const r = result as Record<string, unknown>;
  
  // Ensure required fields exist with defaults
  const validatedResult: BulkOperationResult = {
    success_count: typeof r.success_count === 'number' ? r.success_count : 0,
    failed_count: typeof r.failed_count === 'number' ? r.failed_count : 0,
    errors: Array.isArray(r.errors) ? r.errors : [],
    warnings: Array.isArray(r.warnings) ? r.warnings : [],
    message: typeof r.message === 'string' ? r.message : undefined,
    task_id: typeof r.task_id === 'string' ? r.task_id : undefined,
    missed_hosts: Array.isArray(r.missed_hosts) ? r.missed_hosts : [],
    is_async: typeof r.is_async === 'boolean' ? r.is_async : false,
  };
  
  // Allow zero counts for valid empty operations, but ensure at least some information is present
  if (validatedResult.success_count === 0 && validatedResult.failed_count === 0 && !validatedResult.message) {
    throw new Error('Invalid bulk operation result: no success or failure counts or message provided');
  }
  
  // Control flow: either returns a valid result or throws an error
  return validatedResult;
};

/**
 * Format bulk operation result for user display
 */
export const formatBulkOperationResult = (result: BulkOperationResult): string => {
  const parts: string[] = [];
  
  if (result.success_count > 0) {
    parts.push(`${result.success_count} host${result.success_count > 1 ? 's' : ''} succeeded`);
  }
  
  if (result.failed_count > 0) {
    parts.push(`${result.failed_count} host${result.failed_count > 1 ? 's' : ''} failed`);
  }
  
  if (parts.length === 0) {
    throw new Error('No hosts were processed - invalid bulk operation result');
  }
  
  return parts.join(', ');
};

/**
 * Extract host-specific errors from bulk operation result
 */
export const extractHostErrors = (result: BulkOperationResult): Array<{
  hostId: number;
  hostName?: string;
  error: string;
}> => {
  if (!result.errors || result.errors.length === 0) {
    return [];
  }
  
  return result.errors.map(error => ({
    hostId: error.host_id,
    hostName: error.host_name,
    error: error.message,
  }));
};

/**
 * Check if bulk operation was completely successful
 */
export const isBulkOperationSuccess = (result: BulkOperationResult): boolean => {
  return result.failed_count === 0 && result.success_count > 0;
};

/**
 * Check if bulk operation was partially successful
 */
export const isBulkOperationPartialSuccess = (result: BulkOperationResult): boolean => {
  return result.success_count > 0 && result.failed_count > 0;
};

/**
 * Check if bulk operation completely failed
 */
export const isBulkOperationFailure = (result: BulkOperationResult): boolean => {
  return result.success_count === 0 && result.failed_count > 0;
};

/**
 * Get appropriate notification type for bulk operation result
 */
export const getBulkOperationNotificationType = (result: BulkOperationResult): 'success' | 'warning' | 'danger' => {
  if (isBulkOperationSuccess(result)) {
    return 'success';
  }
  
  if (isBulkOperationPartialSuccess(result)) {
    return 'warning';
  }
  
  return 'danger';
};

/**
 * Create a summary message for bulk operation result
 */
export const createBulkOperationSummary = (
  operationName: string,
  result: BulkOperationResult
): {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'danger';
} => {
  const type = getBulkOperationNotificationType(result);
  const formattedResult = formatBulkOperationResult(result);
  
  let title: string;
  if (type === 'success') {
    title = `${operationName} Completed Successfully`;
  } else if (type === 'warning') {
    title = `${operationName} Partially Completed`;
  } else {
    title = `${operationName} Failed`;
  }
  
  return {
    title,
    message: formattedResult,
    type,
  };
};

/**
 * Retry failed hosts from a previous bulk operation result
 */
export const getFailedHostIds = (result: BulkOperationResult): number[] => {
  if (!result.errors || result.errors.length === 0) {
    return [];
  }
  
  return result.errors
    .map(error => error.host_id)
    .filter(hostId => hostId > 0); // Filter out generic errors
};

/**
 * Validate host IDs before sending to bulk operation
 */
export const validateHostIds = (hostIds: number[]): void => {
  if (!Array.isArray(hostIds)) {
    throw new Error('Host IDs must be an array');
  }
  
  if (hostIds.length === 0) {
    throw new Error('At least one host must be selected');
  }
  
  if (hostIds.some(id => !Number.isInteger(id) || id <= 0)) {
    throw new Error('All host IDs must be positive integers');
  }
  
  // Check for reasonable limits
  if (hostIds.length > MAX_BULK_OPERATION_HOSTS) {
    throw new Error(`Cannot perform bulk operations on more than ${MAX_BULK_OPERATION_HOSTS} hosts at once`);
  }
};

/**
 * Validate bulk operation parameters
 */
export const validateBulkOperationParameters = (
  parameters: Record<string, unknown>,
  requiredParams: string[]
): void => {
  for (const param of requiredParams) {
    if (!(param in parameters) || parameters[param] === null || parameters[param] === undefined) {
      throw new Error(`Required parameter '${param}' is missing`);
    }
  }
};