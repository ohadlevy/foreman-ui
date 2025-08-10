import { describe, it, expect } from 'vitest';
import {
  validateHostIds,
  validateBulkOperationParameters,
  validateBulkOperationResult,
  parseBulkOperationError,
  formatBulkOperationResult,
  extractHostErrors,
  isBulkOperationSuccess,
  isBulkOperationPartialSuccess,
  isBulkOperationFailure,
  getBulkOperationNotificationType,
  createBulkOperationSummary,
  getFailedHostIds,
  MAX_BULK_OPERATION_HOSTS,
} from '../bulkOperationUtils';
import { AxiosError } from 'axios';
import { BulkOperationResult } from '../../types';

describe('bulkOperationUtils', () => {
  describe('validateHostIds', () => {
    it('should accept valid host IDs', () => {
      expect(() => validateHostIds([1, 2, 3])).not.toThrow();
    });

    it('should throw error for empty array', () => {
      expect(() => validateHostIds([])).toThrow('At least one host must be selected');
    });

    it('should throw error for non-array input', () => {
      expect(() => validateHostIds('not an array' as unknown as number[])).toThrow('Host IDs must be an array');
    });

    it('should throw error for invalid host IDs', () => {
      expect(() => validateHostIds([1, 0, 3])).toThrow('All host IDs must be positive integers');
      expect(() => validateHostIds([1, -1, 3])).toThrow('All host IDs must be positive integers');
      expect(() => validateHostIds([1, 2.5, 3])).toThrow('All host IDs must be positive integers');
    });

    it('should throw error for too many hosts', () => {
      const tooManyHosts = Array.from({ length: MAX_BULK_OPERATION_HOSTS + 1 }, (_, i) => i + 1);
      expect(() => validateHostIds(tooManyHosts)).toThrow(`Cannot perform bulk operations on more than ${MAX_BULK_OPERATION_HOSTS} hosts at once`);
    });
  });

  describe('validateBulkOperationParameters', () => {
    it('should accept valid parameters', () => {
      const parameters = { hostgroup_id: 5, environment_id: 3 };
      const required = ['hostgroup_id'];
      expect(() => validateBulkOperationParameters(parameters, required)).not.toThrow();
    });

    it('should throw error for missing required parameters', () => {
      const parameters = { environment_id: 3 };
      const required = ['hostgroup_id'];
      expect(() => validateBulkOperationParameters(parameters, required)).toThrow("Required parameter 'hostgroup_id' is missing");
    });

    it('should throw error for null/undefined values', () => {
      const parameters = { hostgroup_id: null };
      const required = ['hostgroup_id'];
      expect(() => validateBulkOperationParameters(parameters, required)).toThrow("Required parameter 'hostgroup_id' is missing");
    });
  });

  describe('validateBulkOperationResult', () => {
    it('should accept valid result', () => {
      const result = {
        success_count: 2,
        failed_count: 1,
        errors: [{ host_id: 1, message: 'Error' }],
      };
      const validated = validateBulkOperationResult(result);
      expect(validated.success_count).toBe(2);
      expect(validated.failed_count).toBe(1);
    });

    it('should throw error for non-object result', () => {
      expect(() => validateBulkOperationResult('not an object')).toThrow('Invalid bulk operation result: result is not an object');
      expect(() => validateBulkOperationResult(null)).toThrow('Invalid bulk operation result: result is not an object');
    });

    it('should throw error for results with no counts and no message', () => {
      const result = {};
      expect(() => validateBulkOperationResult(result)).toThrow('Invalid bulk operation result: no success or failure counts or message provided');
    });

    it('should allow zero counts when message is provided', () => {
      const result = { success_count: 0, failed_count: 0, message: 'No hosts to process' };
      const validated = validateBulkOperationResult(result);
      expect(validated.success_count).toBe(0);
      expect(validated.failed_count).toBe(0);
      expect(validated.message).toBe('No hosts to process');
    });

    it('should provide defaults for missing fields', () => {
      const result = { success_count: 1, failed_count: 0 };
      const validated = validateBulkOperationResult(result);
      
      expect(validated.errors).toEqual([]);
      expect(validated.warnings).toEqual([]);
      expect(validated.missed_hosts).toEqual([]);
      expect(validated.is_async).toBe(false);
    });
  });

  describe('parseBulkOperationError', () => {
    it('should parse Axios error with structured error data', () => {
      const axiosError = new AxiosError('Request failed');
      axiosError.response = {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          error: {
            message: 'Validation failed',
            full_messages: ['Hostgroup is required', 'Environment cannot be blank'],
          },
        },
        headers: {},
        config: {} as any,
      };

      const parsed = parseBulkOperationError(axiosError);
      
      expect(parsed.message).toBe('Validation failed');
      expect(parsed.details).toEqual(['Hostgroup is required', 'Environment cannot be blank']);
      expect(parsed.statusCode).toBe(422);
    });

    it('should parse Axios error without structured data', () => {
      const axiosError = new AxiosError('Network Error');
      axiosError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        headers: {},
        config: {} as any,
      };

      const parsed = parseBulkOperationError(axiosError);
      
      expect(parsed.message).toBe('Network Error');
      expect(parsed.statusCode).toBe(500);
    });

    it('should parse Error objects', () => {
      const error = new Error('Something went wrong');
      const parsed = parseBulkOperationError(error);
      
      expect(parsed.message).toBe('Something went wrong');
    });

    it('should parse string errors', () => {
      const parsed = parseBulkOperationError('Simple error message');
      expect(parsed.message).toBe('Simple error message');
    });

    it('should handle unknown error types', () => {
      const parsed = parseBulkOperationError({ unknown: 'object' });
      expect(parsed.message).toBe('An unknown error occurred during bulk operation');
    });
  });

  describe('formatBulkOperationResult', () => {
    it('should format successful result', () => {
      const result: BulkOperationResult = {
        success_count: 3,
        failed_count: 0,
        errors: [],
      };
      expect(formatBulkOperationResult(result)).toBe('3 hosts succeeded');
    });

    it('should format failed result', () => {
      const result: BulkOperationResult = {
        success_count: 0,
        failed_count: 2,
        errors: [],
      };
      expect(formatBulkOperationResult(result)).toBe('2 hosts failed');
    });

    it('should format partial success', () => {
      const result: BulkOperationResult = {
        success_count: 2,
        failed_count: 1,
        errors: [],
      };
      expect(formatBulkOperationResult(result)).toBe('2 hosts succeeded, 1 host failed');
    });

    it('should handle singular forms', () => {
      const result: BulkOperationResult = {
        success_count: 1,
        failed_count: 1,
        errors: [],
      };
      expect(formatBulkOperationResult(result)).toBe('1 host succeeded, 1 host failed');
    });

    it('should throw error for no processed hosts', () => {
      const result: BulkOperationResult = {
        success_count: 0,
        failed_count: 0,
        errors: [],
      };
      expect(() => formatBulkOperationResult(result)).toThrow('No hosts were processed - invalid bulk operation result');
    });
  });

  describe('extractHostErrors', () => {
    it('should extract host errors from result', () => {
      const result: BulkOperationResult = {
        success_count: 1,
        failed_count: 2,
        errors: [
          { host_id: 1, host_name: 'host1.example.com', message: 'Permission denied' },
          { host_id: 2, message: 'Host not found' },
        ],
      };

      const hostErrors = extractHostErrors(result);
      
      expect(hostErrors).toHaveLength(2);
      expect(hostErrors[0]).toEqual({
        hostId: 1,
        hostName: 'host1.example.com',
        error: 'Permission denied',
      });
      expect(hostErrors[1]).toEqual({
        hostId: 2,
        hostName: undefined,
        error: 'Host not found',
      });
    });

    it('should return empty array for no errors', () => {
      const result: BulkOperationResult = {
        success_count: 2,
        failed_count: 0,
        errors: [],
      };
      expect(extractHostErrors(result)).toEqual([]);
    });
  });

  describe('operation status checks', () => {
    it('should identify complete success', () => {
      const result: BulkOperationResult = { success_count: 3, failed_count: 0, errors: [] };
      expect(isBulkOperationSuccess(result)).toBe(true);
      expect(isBulkOperationPartialSuccess(result)).toBe(false);
      expect(isBulkOperationFailure(result)).toBe(false);
    });

    it('should identify partial success', () => {
      const result: BulkOperationResult = { success_count: 2, failed_count: 1, errors: [] };
      expect(isBulkOperationSuccess(result)).toBe(false);
      expect(isBulkOperationPartialSuccess(result)).toBe(true);
      expect(isBulkOperationFailure(result)).toBe(false);
    });

    it('should identify complete failure', () => {
      const result: BulkOperationResult = { success_count: 0, failed_count: 3, errors: [] };
      expect(isBulkOperationSuccess(result)).toBe(false);
      expect(isBulkOperationPartialSuccess(result)).toBe(false);
      expect(isBulkOperationFailure(result)).toBe(true);
    });
  });

  describe('getBulkOperationNotificationType', () => {
    it('should return correct notification types', () => {
      const success: BulkOperationResult = { success_count: 3, failed_count: 0, errors: [] };
      const partial: BulkOperationResult = { success_count: 2, failed_count: 1, errors: [] };
      const failure: BulkOperationResult = { success_count: 0, failed_count: 3, errors: [] };

      expect(getBulkOperationNotificationType(success)).toBe('success');
      expect(getBulkOperationNotificationType(partial)).toBe('warning');
      expect(getBulkOperationNotificationType(failure)).toBe('danger');
    });
  });

  describe('createBulkOperationSummary', () => {
    it('should create summary for successful operation', () => {
      const result: BulkOperationResult = { success_count: 3, failed_count: 0, errors: [] };
      const summary = createBulkOperationSummary('Change Hostgroup', result);

      expect(summary.title).toBe('Change Hostgroup Completed Successfully');
      expect(summary.message).toBe('3 hosts succeeded');
      expect(summary.type).toBe('success');
    });

    it('should create summary for partial success', () => {
      const result: BulkOperationResult = { success_count: 2, failed_count: 1, errors: [] };
      const summary = createBulkOperationSummary('Update Environment', result);

      expect(summary.title).toBe('Update Environment Partially Completed');
      expect(summary.message).toBe('2 hosts succeeded, 1 host failed');
      expect(summary.type).toBe('warning');
    });

    it('should create summary for failure', () => {
      const result: BulkOperationResult = { success_count: 0, failed_count: 3, errors: [] };
      const summary = createBulkOperationSummary('Destroy Hosts', result);

      expect(summary.title).toBe('Destroy Hosts Failed');
      expect(summary.message).toBe('3 hosts failed');
      expect(summary.type).toBe('danger');
    });
  });

  describe('getFailedHostIds', () => {
    it('should extract failed host IDs', () => {
      const result: BulkOperationResult = {
        success_count: 1,
        failed_count: 2,
        errors: [
          { host_id: 2, message: 'Error 1' },
          { host_id: 3, message: 'Error 2' },
          { host_id: -1, message: 'Generic error' }, // Should be filtered out
        ],
      };

      const failedIds = getFailedHostIds(result);
      expect(failedIds).toEqual([2, 3]);
    });

    it('should return empty array for no errors', () => {
      const result: BulkOperationResult = { success_count: 3, failed_count: 0, errors: [] };
      expect(getFailedHostIds(result)).toEqual([]);
    });
  });
});