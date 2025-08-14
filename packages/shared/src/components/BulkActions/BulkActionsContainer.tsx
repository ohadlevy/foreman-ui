import React, { useState, useEffect } from 'react';
import { BulkActionToolbar } from './BulkActionToolbar';
import { BulkActionModal } from './BulkActionModal';
import { BulkOperationProgressComponent, GENERIC_ERROR_ITEM_ID } from './BulkOperationProgress';
import { useBulkActions } from './BulkActionsProvider';
import { useAutoClear } from '../../hooks/useAutoClear';
import { BulkAction, BulkOperationResult } from '../../types';
import { hasRetryableErrors, BulkOperationValidationError, BulkOperationExecutionError } from '../../utils/bulkOperationUtils';

// Error message constants
const NO_RESULT_ERROR_MESSAGE = 'Bulk operation failed to return a result - this indicates an internal error. Please try again or contact your system administrator.';

// Layout constants
const BULK_ACTIONS_CONTAINER_MIN_HEIGHT = '64px';


// Helper function to build bulk operation error result
const buildBulkOperationErrorResult = (
  actionLabel: string,
  itemCount: number,
  errorMessage: string,
  errorType: string
): BulkOperationResult => {
  const itemText = itemCount === 1 ? 'item' : 'items';
  return {
    success_count: 0,
    failed_count: itemCount,
    errors: [{ 
      item_id: GENERIC_ERROR_ITEM_ID, 
      message: `${actionLabel} failed for ${itemCount} ${itemText} (${errorType}): ${errorMessage}` 
    }],
  };
};

interface SelectedItem {
  id: number;
  name: string;
}

interface BulkActionsContainerProps {
  selectedItems: SelectedItem[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAllPages?: () => void;
  showSelectAllPages?: boolean;
  className?: string;
  autoClearTimeoutMs?: number; // Time in milliseconds before auto-clearing selection after successful operation
  onSuccess?: () => void; // Callback to refresh data after successful bulk operation
}

export const BulkActionsContainer: React.FC<BulkActionsContainerProps> = ({
  selectedItems,
  totalCount,
  onClearSelection,
  onSelectAllPages,
  showSelectAllPages = false,
  className,
  autoClearTimeoutMs = 3000, // Default to 3 seconds
  onSuccess,
}) => {
  const { actions, isLoading } = useBulkActions();
  const [activeModal, setActiveModal] = useState<BulkAction | null>(null);
  const [operationProgress, setOperationProgress] = useState<{
    operation: BulkAction;
    result?: BulkOperationResult;
  } | null>(null);
  
  const { autoClearMessage, scheduleAutoClear, cancelAutoClear } = useAutoClear({
    onClearSelection,
    onClearProgress: () => setOperationProgress(null),
    timeoutMs: autoClearTimeoutMs,
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return cancelAutoClear;
  }, [cancelAutoClear]);

  // Helper function to extract item IDs for improved readability and DRY principle
  const getSelectedItemIds = (): number[] => {
    return selectedItems.map(item => item.id);
  };

  const handleActionClick = (action: BulkAction) => {
    if (action.disabled) return;
    
    if (action.requiresConfirmation) {
      setActiveModal(action);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction, parameters?: Record<string, unknown>) => {
    try {
      setActiveModal(null);
      setOperationProgress({ operation: action });
      
      // Execute the action and get the actual result
      const selectedItemIds = getSelectedItemIds();
      const result = await action.action(selectedItemIds, parameters);
      
      // If no result is returned, treat it as an error rather than assuming success
      if (!result) {
        throw new Error(NO_RESULT_ERROR_MESSAGE);
      }
      
      const finalResult = result;
      
      setOperationProgress(prev => prev ? { ...prev, result: finalResult } : null);
      
      // Auto-clear selection after operation completion (configurable timeout)
      scheduleAutoClear();
      
      // Call success callback if provided (for additional custom logic)
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      let errorMessage = 'Operation failed';
      let errorType = 'Execution Error';
      
      if (error instanceof BulkOperationValidationError) {
        errorMessage = error.message;
        errorType = 'Validation Error';
      } else if (error instanceof BulkOperationExecutionError) {
        errorMessage = error.message;
        errorType = 'Execution Error';
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorType = 'Execution Error';
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorType = 'Execution Error';
      } else {
        errorMessage = `${action.label} operation failed unexpectedly`;
        errorType = 'Unknown Error';
      }
      
      const result = buildBulkOperationErrorResult(
        action.label,
        selectedItems.length,
        errorMessage,
        errorType
      );
      
      setOperationProgress(prev => prev ? { ...prev, result } : null);
    }
  };

  const handleModalConfirm = async (parameters?: Record<string, unknown>) => {
    if (!activeModal) return { success_count: 0, failed_count: 0, errors: [] };
    
    try {
      // Execute the action directly and return its actual result
      const selectedItemIds = getSelectedItemIds();
      const result = await activeModal.action(selectedItemIds, parameters);
      
      if (!result) {
        throw new Error(NO_RESULT_ERROR_MESSAGE);
      }
      
      // Close modal and set progress with the actual result
      setActiveModal(null);
      setOperationProgress({ operation: activeModal, result });
      
      // Auto-clear selection only if operation completed without any failures
      if (result.failed_count === 0 && result.success_count > 0) {
        scheduleAutoClear();
      }
      
      return result;
    } catch (error) {
      let errorMessage = 'Operation failed';
      let errorType = 'Execution Error';
      
      if (error instanceof BulkOperationValidationError) {
        errorMessage = error.message;
        errorType = 'Validation Error';
      } else if (error instanceof BulkOperationExecutionError) {
        errorMessage = error.message;
        errorType = 'Execution Error';
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorType = 'Execution Error';
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorType = 'Execution Error';
      } else {
        errorMessage = `${activeModal.label} operation failed unexpectedly`;
        errorType = 'Unknown Error';
      }
      
      const result = buildBulkOperationErrorResult(
        activeModal.label,
        selectedItems.length,
        errorMessage,
        errorType
      );
      
      // Close modal and set progress with error result
      setActiveModal(null);
      setOperationProgress({ operation: activeModal, result });
      
      return result;
    }
  };

  const handleRetryOperation = () => {
    if (operationProgress) {
      executeAction(operationProgress.operation);
    }
  };

  const handleCloseProgress = () => {
    setOperationProgress(null);
  };

  if (isLoading) {
    return <div>Loading bulk actions...</div>;
  }

  return (
    <div className={className} style={{ minHeight: selectedItems.length === 0 ? BULK_ACTIONS_CONTAINER_MIN_HEIGHT : undefined }}>
      {/* Aria-live region for auto-clear announcements */}
      <div aria-live="polite" aria-atomic="true" className="pf-v6-u-sr-only">
        {autoClearMessage}
      </div>
      
      {/* Bulk Action Toolbar - only show when items are selected */}
      {selectedItems.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedItems.length}
          totalCount={totalCount}
          onClearSelection={onClearSelection}
          actions={actions}
          onActionClick={handleActionClick}
          onSelectAllPages={onSelectAllPages}
          showSelectAllPages={showSelectAllPages}
        />
      )}

      {/* Modal for actions requiring confirmation/parameters */}
      {activeModal && (
        <BulkActionModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={activeModal.confirmationTitle || activeModal.label}
          selectedCount={selectedItems.length}
          selectedItems={selectedItems}
          onConfirm={handleModalConfirm}
          confirmationMessage={activeModal.confirmationMessage}
          requiresConfirmation={activeModal.requiresConfirmation}
          destructive={activeModal.destructive}
          parameters={activeModal.parameters}
        />
      )}

      {/* Progress tracking for long-running operations */}
      {operationProgress && (
        <div className="pf-v6-u-mt-md">
          <BulkOperationProgressComponent
            operationId={operationProgress.operation.id}
            operationLabel={operationProgress.operation.label}
            totalItems={selectedItems.length}
            result={operationProgress.result}
            onClose={handleCloseProgress}
            onRetry={hasRetryableErrors(operationProgress.result) ? handleRetryOperation : undefined}
            showDetails={true}
          />
        </div>
      )}
    </div>
  );
};