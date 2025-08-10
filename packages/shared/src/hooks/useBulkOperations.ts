import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BulkOperationsAPI, BulkOperationConfig } from '../api/bulkOperations';
import { BulkOperationResult } from '../types';
import { useApi } from './useApi';
import { useNotificationStore } from '../stores/notificationStore';
import {
  validateHostIds,
  validateBulkOperationParameters,
  validateBulkOperationResult,
  parseBulkOperationError,
  createBulkOperationSummary,
  getFailedHostIds,
} from '../utils/bulkOperationUtils';
import { generateUniqueId } from '../utils/idGenerator';

export interface UseBulkOperationMutationOptions {
  onSuccess?: (result: BulkOperationResult) => void;
  onError?: (error: Error) => void;
  showNotifications?: boolean;
}

export interface BulkOperationParams {
  operationId: string;
  hostIds: number[];
  parameters?: Record<string, unknown>;
}

export const useBulkOperations = () => {
  const queryClient = useQueryClient();
  const api = useApi();
  const { addNotification } = useNotificationStore();
  
  const bulkAPI = new BulkOperationsAPI(api.client);

  // Main bulk operation mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operationId, hostIds, parameters }: BulkOperationParams): Promise<BulkOperationResult> => {
      // Validate inputs before making the API call
      validateHostIds(hostIds);
      
      const operationConfig = getOperationConfig(operationId);
      if (!operationConfig) {
        throw new Error(`Unknown operation: ${operationId}`);
      }
      
      // Validate required parameters
      const requiredParams = operationConfig.parameters
        ?.filter(param => param.required)
        .map(param => param.key) || [];
      
      if (parameters && requiredParams.length > 0) {
        validateBulkOperationParameters(parameters, requiredParams);
      }
      
      try {
        const result = await bulkAPI.executeBulkOperation(operationId, hostIds, parameters);
        return validateBulkOperationResult(result);
      } catch (error) {
        const parsedError = parseBulkOperationError(error);
        throw new Error(parsedError.message);
      }
    },
    onSuccess: (result: BulkOperationResult, variables: BulkOperationParams) => {
      // Invalidate hosts cache to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      
      // Get operation name for better notifications
      const operationConfig = getOperationConfig(variables.operationId);
      const operationName = operationConfig?.label || 'Bulk Operation';
      
      // Create contextual notification
      const summary = createBulkOperationSummary(operationName, result);
      addNotification({
        id: generateUniqueId(),
        level: summary.type === 'success' ? 'success' : summary.type === 'warning' ? 'warning' : 'error',
        text: summary.title,
        created_at: new Date().toISOString(),
        group: 'Bulk Operations',
        seen: false,
      });
    },
    onError: (error: Error, variables: BulkOperationParams) => {
      const operationConfig = getOperationConfig(variables.operationId);
      const operationName = operationConfig?.label || 'Bulk Operation';
      
      addNotification({
        id: generateUniqueId(),
        level: 'error',
        text: `${operationName} Failed: ${error.message || 'An unexpected error occurred'}`,
        created_at: new Date().toISOString(),
        group: 'Bulk Operations',
        seen: false,
      });
    },
  });

  // Individual operation mutations for better type safety
  const updateHostgroupMutation = useMutation({
    mutationFn: ({ hostIds, hostgroupId }: { hostIds: number[]; hostgroupId: number }) =>
      bulkAPI.updateHostgroup(hostIds, hostgroupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const updateEnvironmentMutation = useMutation({
    mutationFn: ({ hostIds, environmentId }: { hostIds: number[]; environmentId: number }) =>
      bulkAPI.updateEnvironment(hostIds, environmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const updateOwnerMutation = useMutation({
    mutationFn: ({ hostIds, ownerId, ownerType }: { hostIds: number[]; ownerId: number; ownerType?: string }) =>
      bulkAPI.updateOwner(hostIds, ownerId, ownerType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: ({ hostIds, organizationId }: { hostIds: number[]; organizationId: number }) =>
      bulkAPI.updateOrganization(hostIds, organizationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ hostIds, locationId }: { hostIds: number[]; locationId: number }) =>
      bulkAPI.updateLocation(hostIds, locationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const buildMutation = useMutation({
    mutationFn: (hostIds: number[]) => bulkAPI.build(hostIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const destroyMutation = useMutation({
    mutationFn: (hostIds: number[]) => bulkAPI.destroy(hostIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const enableMutation = useMutation({
    mutationFn: (hostIds: number[]) => bulkAPI.enable(hostIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const disableMutation = useMutation({
    mutationFn: (hostIds: number[]) => bulkAPI.disable(hostIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  const disownMutation = useMutation({
    mutationFn: (hostIds: number[]) => bulkAPI.disown(hostIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });

  // Get available operations configuration
  const getOperationsConfig = (): BulkOperationConfig[] => {
    return bulkAPI.getBulkOperationsConfig();
  };

  // Helper to get operation config by ID
  const getOperationConfig = (operationId: string): BulkOperationConfig | undefined => {
    return getOperationsConfig().find(op => op.id === operationId);
  };

  // Retry failed hosts from a previous operation
  const retryFailedHosts = async (
    operationId: string,
    previousResult: BulkOperationResult,
    parameters?: Record<string, unknown>,
    options?: UseBulkOperationMutationOptions
  ): Promise<BulkOperationResult> => {
    const failedHostIds = getFailedHostIds(previousResult);
    
    if (failedHostIds.length === 0) {
      throw new Error('No failed hosts to retry');
    }
    
    return executeBulkOperation(operationId, failedHostIds, parameters, options);
  };

  // Execute bulk operation with proper error handling
  const executeBulkOperation = async (
    operationId: string,
    hostIds: number[],
    parameters?: Record<string, unknown>,
    options?: UseBulkOperationMutationOptions
  ): Promise<BulkOperationResult> => {
    try {
      const result = await bulkOperationMutation.mutateAsync({
        operationId,
        hostIds,
        parameters,
      });

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorObj = new Error(errorMessage);

      if (options?.onError) {
        options.onError(errorObj);
      }

      throw errorObj;
    }
  };

  return {
    // Main mutation
    bulkOperation: bulkOperationMutation,
    
    // Individual operation mutations
    updateHostgroup: updateHostgroupMutation,
    updateEnvironment: updateEnvironmentMutation,
    updateOwner: updateOwnerMutation,
    updateOrganization: updateOrganizationMutation,
    updateLocation: updateLocationMutation,
    build: buildMutation,
    destroy: destroyMutation,
    enable: enableMutation,
    disable: disableMutation,
    disown: disownMutation,

    // Helper functions
    executeBulkOperation,
    retryFailedHosts,
    getOperationsConfig,
    getOperationConfig,

    // Status flags
    isLoading: bulkOperationMutation.isPending,
    isError: bulkOperationMutation.isError,
    error: bulkOperationMutation.error,
  };
};

export default useBulkOperations;