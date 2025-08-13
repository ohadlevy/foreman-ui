import { AxiosError } from 'axios';
import { BulkOperationResult } from '../types';

// Configuration constants
export const MAX_BULK_OPERATION_HOSTS = 1000;

/**
 * Foreman bulk API response format
 * 
 * Foreman API v2 bulk operations return:
 * - Success (HTTP 200): { message: "Built 5 hosts" } or { message: "Updated host: changed owner" }
 * - Failure (HTTP 4xx/5xx): Error response with details
 * 
 * Since we trust HTTP status codes, we don't need to parse message content.
 */

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
 * Validate bulk operation result based on Foreman API v2 format
 * 
 * Since this is called only on HTTP 200 responses, we trust the operation succeeded.
 * Foreman returns: { message: "Built 5 hosts" } or { message: "Updated host: changed owner" }
 */
export const validateBulkOperationResult = (
  result: unknown, 
  requestedItemCount: number
): BulkOperationResult => {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid bulk operation result');
  }
  
  const r = result as Record<string, unknown>;
  const message = typeof r.message === 'string' ? r.message : 'Operation completed successfully';
  
  // HTTP 200 means all requested items succeeded
  return {
    success_count: requestedItemCount,
    failed_count: 0,
    errors: [],
    warnings: Array.isArray(r.warnings) ? r.warnings : [],
    message,
    task_id: typeof r.task_id === 'string' ? r.task_id : undefined,
    missed_items: [],
    is_async: typeof r.is_async === 'boolean' ? r.is_async : false,
  };
};

/**
 * Format bulk operation result for user display
 * Prioritizes the original Foreman message when available
 */
export const formatBulkOperationResult = (result: BulkOperationResult): string => {
  // If we have a meaningful message from Foreman, use it
  if (result.message && result.message !== 'Operation completed successfully') {
    return result.message;
  }
  
  // Fallback to count-based formatting
  const parts: string[] = [];
  
  if (result.success_count > 0) {
    parts.push(`${result.success_count} host${result.success_count > 1 ? 's' : ''} succeeded`);
  }
  
  if (result.failed_count > 0) {
    parts.push(`${result.failed_count} host${result.failed_count > 1 ? 's' : ''} failed`);
  }
  
  if (parts.length === 0) {
    return result.message || DEFAULT_BULK_OPERATION_SUCCESS_MESSAGE;
  }
  
  return parts.join(', ');
};

/**
 * Extract item-specific errors from bulk operation result
 */
export const extractItemErrors = (result: BulkOperationResult): Array<{
  hostId: number;
  hostName?: string;
  error: string;
}> => {
  if (!result.errors || result.errors.length === 0) {
    return [];
  }
  
  return result.errors.map(error => ({
    hostId: error.item_id,
    hostName: error.item_name,
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
 * Check if there are retryable errors in a bulk operation result
 */
export const hasRetryableErrors = (result: BulkOperationResult | undefined): boolean => {
  if (!result) return false;
  return result.failed_count > 0 && Boolean(result.errors && result.errors.length > 0);
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
 * Retry failed items from a previous bulk operation result
 */
export const getFailedItemIds = (result: BulkOperationResult): number[] => {
  if (!result.errors || result.errors.length === 0) {
    return [];
  }
  
  return result.errors
    .map(error => error.item_id)
    .filter(itemId => itemId > 0); // Filter out generic errors
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
    throw new Error('Invalid host IDs detected');
  }
  
  if (hostIds.length > MAX_BULK_OPERATION_HOSTS) {
    throw new Error(`Cannot perform bulk operations on more than ${MAX_BULK_OPERATION_HOSTS} hosts at once`);
  }
};

/**
 * Constants for bulk operation utilities
 */
const DEFAULT_BULK_OPERATION_SUCCESS_MESSAGE = 'Operation completed';

/**
 * Custom error class for parameter validation failures
 */
export class BulkOperationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkOperationValidationError';
  }
}

/**
 * Custom error class for bulk operation execution failures
 */
export class BulkOperationExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkOperationExecutionError';
  }
}

/**
 * Options for numeric parameter validation
 */
export interface NumericValidationOptions {
  min?: number;
  max?: number;
}

/**
 * Validate a single parameter with type checking and optional constraints
 */
export const validateParameter = (
  parameters: Record<string, unknown> | undefined,
  paramName: string,
  expectedType: 'string' | 'number' | 'boolean',
  options?: NumericValidationOptions
): void => {
  if (!parameters || parameters[paramName] === undefined || parameters[paramName] === null) {
    throw new BulkOperationValidationError(`Parameter "${paramName}" is required`);
  }
  
  if (typeof parameters[paramName] !== expectedType) {
    throw new BulkOperationValidationError(`Parameter "${paramName}" must be a ${expectedType}`);
  }
  
  // Additional validation for numeric parameters
  if (expectedType === 'number' && typeof parameters[paramName] === 'number') {
    const numValue = parameters[paramName] as number;
    
    if (Number.isNaN(numValue)) {
      throw new BulkOperationValidationError(`Parameter "${paramName}" contains an invalid numeric value`);
    }
    
    if (options?.min !== undefined && numValue < options.min) {
      throw new BulkOperationValidationError(`Parameter "${paramName}" must be at least ${options.min}`);
    }
    
    if (options?.max !== undefined && numValue > options.max) {
      throw new BulkOperationValidationError(`Parameter "${paramName}" must be at most ${options.max}`);
    }
  }
};

/**
 * Validate bulk operation parameters
 */
export const validateBulkOperationParameters = (
  parameters: Record<string, unknown>,
  requiredParams: string[]
): void => {
  const missingParams = requiredParams.filter(
    param => !(param in parameters) || parameters[param] === null || parameters[param] === undefined
  );
  
  if (missingParams.length > 0) {
    const paramList = missingParams.map(p => `"${p}"`).join(', ');
    throw new Error(`Required parameters missing: ${paramList}`);
  }
};