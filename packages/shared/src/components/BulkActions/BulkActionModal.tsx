import React, { useState } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Alert,
  Text,
  TextVariants,
  Progress,
  ProgressSize,
  List,
  ListItem,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { BulkOperationResult, BulkActionParameter } from '../../types';
import { GENERIC_ERROR_ITEM_ID } from './BulkOperationProgress';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  selectedCount: number;
  selectedItems: Array<{ id: number; name: string }>;
  onConfirm: (parameters?: Record<string, unknown>) => Promise<BulkOperationResult>;
  confirmationMessage?: string;
  requiresConfirmation?: boolean;
  destructive?: boolean;
  parameters?: BulkActionParameter[];
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  title,
  selectedCount,
  selectedItems,
  onConfirm,
  confirmationMessage,
  requiresConfirmation: _requiresConfirmation = true,
  destructive = false,
  parameters = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleParameterChange = (key: string, value: unknown) => {
    setParameterValues(prev => ({ ...prev, [key]: value }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateParameters = () => {
    const errors: string[] = [];

    parameters.forEach(param => {
      if (param.required && !parameterValues[param.key]) {
        errors.push(`${param.label} is required`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleConfirm = async () => {
    if (parameters.length > 0 && !validateParameters()) {
      return;
    }

    setIsLoading(true);
    try {
      const operationResult = await onConfirm(parameterValues);
      setResult(operationResult);
    } catch (error) {
      // TODO: Replace with proper error logging service (e.g., Sentry, LogRocket)
      if (process.env.NODE_ENV === 'development') {
        console.error('Bulk operation failed:', error);
      }
      setResult({
        success_count: 0,
        failed_count: selectedCount,
        errors: [{ item_id: GENERIC_ERROR_ITEM_ID, message: 'Operation failed. Please try again.' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setParameterValues({});
    setValidationErrors([]);
    onClose();
  };

  const renderParameterField = (param: BulkActionParameter) => {
    switch (param.type) {
      case 'select':
        return (
          <FormSelect
            value={parameterValues[param.key] as string || ''}
            onChange={(_event, value) => {
              // Convert numeric option values back to numbers
              const numValue = Number(value);
              const finalValue = !isNaN(numValue) && value !== '' ? numValue : value;
              handleParameterChange(param.key, finalValue);
            }}
            aria-label={param.label}
          >
            <FormSelectOption value="" label={param.placeholder || `Select ${param.label.toLowerCase()}`} />
            {param.options?.map(option => (
              <FormSelectOption
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </FormSelect>
        );
      case 'number':
        return (
          <input
            type="number"
            className="pf-v5-c-form-control"
            value={parameterValues[param.key] as number || ''}
            onChange={(e) => handleParameterChange(param.key, Number(e.target.value) || 0)}
            placeholder={param.placeholder}
          />
        );
      default:
        return (
          <input
            type="text"
            className="pf-v5-c-form-control"
            value={parameterValues[param.key] as string || ''}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
            placeholder={param.placeholder}
          />
        );
    }
  };

  const resultContent = result && (
    <>
      {result.success_count > 0 && (
        <Alert variant="success" title={`Successfully processed ${result.success_count} items`} />
      )}

      {result.failed_count > 0 && (
        <Alert
          variant="danger"
          title={`Failed to process ${result.failed_count} items`}
        >
          {result.errors && result.errors.length > 0 && (
            <List>
              {result.errors.slice(0, 10).map((error, index) => (
                <ListItem key={index}>
                  {error.item_name ? `${error.item_name}: ` : ''}
                  {error.message}
                </ListItem>
              ))}
              {result.errors.length > 10 && (
                <ListItem>... and {result.errors.length - 10} more errors</ListItem>
              )}
            </List>
          )}
        </Alert>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <Alert variant="warning" title="Warnings">
          <List>
            {result.warnings.map((warning, index) => (
              <ListItem key={index}>{warning}</ListItem>
            ))}
          </List>
        </Alert>
      )}
    </>
  );

  return (
    <Modal
      variant={ModalVariant.medium}
      title={title}
      isOpen={isOpen}
      onClose={handleClose}
      actions={
        result ? [
          <Button key="close" variant="primary" onClick={handleClose}>
            Close
          </Button>
        ] : [
          <Button
            key="confirm"
            variant={destructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {destructive ? 'Delete' : 'Apply'}
          </Button>,
          <Button key="cancel" variant="link" onClick={handleClose} isDisabled={isLoading}>
            Cancel
          </Button>,
        ]
      }
    >
      {result ? resultContent : (
        <>
          {isLoading && (
            <Progress size={ProgressSize.sm} title="Processing..." />
          )}

          {!isLoading && (
            <>
              {destructive && (
                <Alert
                  variant="warning"
                  title="Destructive action"
                  className="pf-v5-u-mb-md"
                >
                  <ExclamationTriangleIcon /> This action cannot be undone.
                </Alert>
              )}

              {confirmationMessage && (
                <Text component={TextVariants.p} className="pf-v5-u-mb-md">
                  {confirmationMessage}
                </Text>
              )}

              <Text component={TextVariants.p} className="pf-v5-u-mb-md">
                This action will affect <strong>{selectedCount}</strong> selected items:
              </Text>

              <div className="pf-v5-u-mb-md" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <List>
                  {selectedItems.slice(0, 10).map(item => (
                    <ListItem key={item.id}>{item.name}</ListItem>
                  ))}
                  {selectedItems.length > 10 && (
                    <ListItem>... and {selectedItems.length - 10} more items</ListItem>
                  )}
                </List>
              </div>

              {parameters.length > 0 && (
                <Form>
                  {parameters.map(param => (
                    <FormGroup
                      key={param.key}
                      label={param.label}
                      isRequired={param.required}
                      fieldId={param.key}
                    >
                      {renderParameterField(param)}
                    </FormGroup>
                  ))}
                </Form>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="danger" title="Please fix the following errors:">
                  <List>
                    {validationErrors.map((error, index) => (
                      <ListItem key={index}>{error}</ListItem>
                    ))}
                  </List>
                </Alert>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
};