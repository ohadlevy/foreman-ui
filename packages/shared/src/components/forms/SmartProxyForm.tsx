import React, { useState, useEffect } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  ActionGroup,
  Card,
  CardBody,
  CardTitle,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { SmartProxyFormData } from '../../types';

interface SmartProxyFormProps {
  initialData?: Partial<SmartProxyFormData>;
  onSubmit: (data: SmartProxyFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  isEdit?: boolean;
}

export const SmartProxyForm: React.FC<SmartProxyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<SmartProxyFormData>({
    name: '',
    url: '',
    ...initialData,
  });

  const [validated, setValidated] = useState<{
    name: 'success' | 'error' | 'default';
    url: 'success' | 'error' | 'default';
  }>({
    name: 'default',
    url: 'default',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateField = (field: keyof typeof validated, value: string) => {
    switch (field) {
      case 'name':
        return value.trim().length >= 2 ? 'success' : 'error';
      case 'url':
        try {
          // Check if the URL is valid
          const url = new URL(value);
          return url ? 'success' : 'error';
        } catch {
          return 'error';
        }
      default:
        return 'default';
    }
  };

  const handleInputChange = (field: keyof SmartProxyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name' || field === 'url') {
      setValidated(prev => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameValid = validateField('name', formData.name);
    const urlValid = validateField('url', formData.url);
    
    setValidated({
      name: nameValid,
      url: urlValid,
    });

    if (nameValid === 'success' && urlValid === 'success') {
      onSubmit(formData);
    }
  };

  const isFormValid = 
    validated.name === 'success' && 
    validated.url === 'success';

  return (
    <Card>
      <CardTitle>{isEdit ? 'Edit Smart Proxy' : 'Add Smart Proxy'}</CardTitle>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" title="Form submission failed" isInline className="pf-v5-u-mb-md">
              {error}
            </Alert>
          )}

          <FormGroup
            label="Name"
            isRequired
            fieldId="name"
          >
            <TextInput
              isRequired
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(_event, value) => handleInputChange('name', value)}
              validated={validated.name}
              placeholder="Enter Smart Proxy name"
            />
            {validated.name === 'error' && (
              <HelperText>
                <HelperTextItem variant="error">
                  Name must be at least 2 characters long
                </HelperTextItem>
              </HelperText>
            )}
          </FormGroup>

          <FormGroup
            label="URL"
            isRequired
            fieldId="url"
          >
            <TextInput
              isRequired
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={(_event, value) => handleInputChange('url', value)}
              validated={validated.url}
              placeholder="https://proxy.example.com:8443"
            />
            {validated.url === 'error' && (
              <HelperText>
                <HelperTextItem variant="error">
                  Please enter a valid URL (e.g., https://proxy.example.com:8443)
                </HelperTextItem>
              </HelperText>
            )}
          </FormGroup>

          <ActionGroup>
            <Button
              type="submit"
              variant="primary"
              isDisabled={isLoading || !isFormValid}
              isLoading={isLoading}
            >
              {isLoading ? 'Saving...' : isEdit ? 'Update Smart Proxy' : 'Add Smart Proxy'}
            </Button>
            {onCancel && (
              <Button variant="link" onClick={onCancel} isDisabled={isLoading}>
                Cancel
              </Button>
            )}
          </ActionGroup>
        </Form>
      </CardBody>
    </Card>
  );
};