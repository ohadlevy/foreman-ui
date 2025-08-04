import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Form,
  FormGroup,
  FormHelperText,
  TextInput,
  TextArea,
  Button,
  ActionGroup,
  Alert,
  Switch,
} from '@patternfly/react-core';
import { useCreateHost } from '@foreman/shared';
import { HostFormData } from '@foreman/shared';

export const CreateHost: React.FC = () => {
  const navigate = useNavigate();
  const createHostMutation = useCreateHost();

  const [formData, setFormData] = useState<HostFormData>({
    name: '',
    comment: '',
    build: false,
    enabled: true,
    managed: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Host name is required';
    } else if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(formData.name)) {
      newErrors.name = 'Please enter a valid hostname';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError(null); // Clear any previous errors
      const result = await createHostMutation.mutateAsync(formData);
      navigate(`/hosts/${result.id}`);
    } catch (err: unknown) {
      console.error('Failed to create host:', err);

      // Handle different types of errors
      const error = err as { status?: number; message?: string }; // Type assertion for error handling
      if (error.status === 401) {
        setSubmitError('You do not have permission to create hosts. Please contact your administrator.');
      } else if (error.status === 403) {
        setSubmitError('Access forbidden. You may not have the necessary permissions for this organization or location.');
      } else if (error.status === 422) {
        setSubmitError('Invalid host data. Please check your input and try again.');
      } else {
        setSubmitError('Failed to create host. Please try again or contact your administrator.');
      }
    }
  };

  const handleInputChange = (field: keyof HostFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Create New Host
        </Title>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            {submitError && (
              <Alert
                variant="danger"
                title="Failed to create host"
                isInline
                className="pf-v5-u-mb-md"
              >
                {submitError}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup
                label="Host name"
                isRequired
                fieldId="host-name"
              >
                <TextInput
                  isRequired
                  type="text"
                  id="host-name"
                  name="host-name"
                  value={formData.name}
                  onChange={(_event, value) => handleInputChange('name', value)}
                    placeholder="host.example.com"
                />
                {errors.name ? (
                  <FormHelperText>{errors.name}</FormHelperText>
                ) : (
                  <FormHelperText>Enter a fully qualified domain name (FQDN)</FormHelperText>
                )}
              </FormGroup>

              <FormGroup
                label="Comment"
                fieldId="host-comment"
              >
                <TextArea
                  id="host-comment"
                  name="host-comment"
                  value={formData.comment || ''}
                  onChange={(_event, value) => handleInputChange('comment', value)}
                  placeholder="Enter a description for this host..."
                  rows={3}
                />
                <FormHelperText>Optional description for this host</FormHelperText>
              </FormGroup>

              <FormGroup
                label="Host options"
                fieldId="host-options"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <Switch
                      id="host-enabled"
                      label="Enabled"
                      labelOff="Disabled"
                      isChecked={formData.enabled || false}
                      onChange={(_event, checked) => handleInputChange('enabled', checked)}
                    />
                    <FormHelperText>Whether this host should be enabled</FormHelperText>
                  </div>

                  <div>
                    <Switch
                      id="host-managed"
                      label="Managed"
                      labelOff="Unmanaged"
                      isChecked={formData.managed || false}
                      onChange={(_event, checked) => handleInputChange('managed', checked)}
                    />
                    <FormHelperText>Whether Foreman should manage this host&apos;s configuration</FormHelperText>
                  </div>

                  <div>
                    <Switch
                      id="host-build"
                      label="Build mode"
                      labelOff="Normal mode"
                      isChecked={formData.build || false}
                      onChange={(_event, checked) => handleInputChange('build', checked)}
                    />
                    <FormHelperText>Enable build mode for provisioning</FormHelperText>
                  </div>
                </div>
              </FormGroup>

              <ActionGroup>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createHostMutation.isPending}
                  isDisabled={createHostMutation.isPending}
                >
                  {createHostMutation.isPending ? 'Creating...' : 'Create Host'}
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate('/hosts')}
                  isDisabled={createHostMutation.isPending}
                >
                  Cancel
                </Button>
              </ActionGroup>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};