import React, { useState, useEffect } from 'react';
import {
  Progress,
  ProgressSize,
  ProgressMeasureLocation,
  Card,
  CardBody,
  CardTitle,
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  List,
  ListItem,
} from '@patternfly/react-core';
import {
  TimesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
} from '@patternfly/react-icons';
import { BulkOperationResult, BulkOperationProgress } from '../../types';

// Progress simulation constants (temporary mock - replace with real progress API)
const PROGRESS_SIMULATION_CONFIG = {
  MAX_INCREMENT: 3,
  MIN_INCREMENT: 1,
  FAILURE_PROBABILITY_THRESHOLD: 0.9,
  UPDATE_INTERVAL_MS: 1000,
} as const;

// Generic error item ID for operations without specific item context
export const GENERIC_ERROR_ITEM_ID = -1;

interface BulkOperationProgressProps {
  operationId: string;
  operationLabel: string;
  totalItems: number;
  result?: BulkOperationResult;
  onClose?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const BulkOperationProgressComponent: React.FC<BulkOperationProgressProps> = ({
  operationId,
  operationLabel,
  totalItems,
  result,
  onClose,
  onRetry,
  showDetails = true,
}) => {
  const [progress, setProgress] = useState<BulkOperationProgress>({
    operation_id: operationId,
    total_items: totalItems,
    completed_items: 0,
    failed_items: 0,
    current_status: 'Starting operation...',
  });

  const [isCompleted, setIsCompleted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate progress updates (in real implementation, this would poll an API)
  useEffect(() => {
    if (result && !isCompleted) {
      setProgress(prev => ({
        ...prev,
        completed_items: result.success_count,
        failed_items: result.failed_count,
        current_status: getStatusMessage(result),
      }));
      setIsCompleted(true);
      return;
    }

    if (isCompleted) return;

    const interval = window.setInterval(() => {
      setProgress(prev => {
        const newCompleted = Math.min(
          prev.completed_items + Math.floor(Math.random() * PROGRESS_SIMULATION_CONFIG.MAX_INCREMENT) + PROGRESS_SIMULATION_CONFIG.MIN_INCREMENT,
          totalItems
        );
        const newFailed = Math.min(
          prev.failed_items + (Math.random() > PROGRESS_SIMULATION_CONFIG.FAILURE_PROBABILITY_THRESHOLD ? PROGRESS_SIMULATION_CONFIG.MIN_INCREMENT : 0),
          totalItems - newCompleted
        );

        if (newCompleted + newFailed >= totalItems) {
          setIsCompleted(true);
          window.clearInterval(interval);
        }

        return {
          ...prev,
          completed_items: newCompleted,
          failed_items: newFailed,
          current_status: getProgressStatus(newCompleted, newFailed, totalItems),
        };
      });
    }, PROGRESS_SIMULATION_CONFIG.UPDATE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [result, totalItems, isCompleted]);

  const getProgressStatus = (completed: number, failed: number, total: number): string => {
    if (completed + failed >= total) {
      if (failed === 0) return 'All operations completed successfully';
      if (completed === 0) return 'All operations failed';
      return `Completed with ${failed} failure${failed > 1 ? 's' : ''}`;
    }
    return `Processing... (${completed + failed}/${total})`;
  };

  const getStatusMessage = (result: BulkOperationResult): string => {
    if (result.failed_count === 0) {
      return `Successfully completed ${result.success_count} operation${result.success_count > 1 ? 's' : ''}`;
    }
    if (result.success_count === 0) {
      return `Failed to complete operations. ${result.failed_count} error${result.failed_count > 1 ? 's' : ''}`;
    }
    return `Completed ${result.success_count} operations with ${result.failed_count} failure${result.failed_count > 1 ? 's' : ''}`;
  };

  const getProgressVariant = () => {
    if (!isCompleted) return undefined;
    if (progress.failed_items === 0) return 'success';
    if (progress.completed_items === 0) return 'danger';
    return 'warning';
  };

  const getStatusIcon = () => {
    if (!isCompleted) return <InProgressIcon className="pf-v5-u-mr-sm" />;
    if (progress.failed_items === 0) return <CheckCircleIcon className="pf-v5-u-mr-sm pf-v5-u-success-color-100" />;
    if (progress.completed_items === 0) return <TimesIcon className="pf-v5-u-mr-sm pf-v5-u-danger-color-100" />;
    return <ExclamationTriangleIcon className="pf-v5-u-mr-sm pf-v5-u-warning-color-100" />;
  };

  const progressPercentage = Math.round(((progress.completed_items + progress.failed_items) / progress.total_items) * 100);

  return (
    <Card>
      <CardTitle>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            {getStatusIcon()}
            {operationLabel}
          </FlexItem>
          <FlexItem align={{ default: 'alignRight' }}>
            {onClose && (
              <Button variant="plain" onClick={onClose} aria-label="Close progress">
                <TimesIcon />
              </Button>
            )}
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        <div className="pf-v5-u-mb-md">
          <Progress
            value={progressPercentage}
            title="Operation Progress"
            size={ProgressSize.lg}
            measureLocation={ProgressMeasureLocation.top}
            variant={getProgressVariant()}
          />
        </div>

        <div className="pf-v5-u-mb-sm">
          <Flex spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              <Label color="green">{progress.completed_items} completed</Label>
            </FlexItem>
            {progress.failed_items > 0 && (
              <FlexItem>
                <Label color="red">{progress.failed_items} failed</Label>
              </FlexItem>
            )}
            <FlexItem>
              <Label color="grey">{progress.total_items} total</Label>
            </FlexItem>
          </Flex>
        </div>

        <div className="pf-v5-u-mb-md">
          <span className="pf-v5-u-text-color-100">{progress.current_status}</span>
        </div>

        {isCompleted && progress.failed_items > 0 && showDetails && (
          <div className="pf-v5-u-mb-md">
            <Button
              variant="link"
              onClick={() => setIsExpanded(!isExpanded)}
              className="pf-v5-u-pl-0"
            >
              {isExpanded ? 'Hide' : 'Show'} error details
            </Button>

            {isExpanded && result?.errors && (
              <Alert variant="danger" title="Failed Operations" className="pf-v5-u-mt-sm">
                <List>
                  {result.errors.map((error, index) => (
                    <ListItem key={index}>
                      <strong>{error.item_name || `Item ${error.item_id}`}:</strong> {error.message}
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </div>
        )}

        {isCompleted && progress.failed_items > 0 && onRetry && (
          <div className="pf-v5-u-mt-md">
            <Button variant="secondary" onClick={onRetry}>
              Retry Failed Operations
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};