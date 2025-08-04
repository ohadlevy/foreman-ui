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
  Checkbox,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { UserFormData } from '../../types';
import { VALIDATION_PATTERNS } from '../../constants';

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  isEdit?: boolean;
  showPasswordFields?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  isEdit = false,
  showPasswordFields = true,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    login: '',
    firstname: '',
    lastname: '',
    mail: '',
    password: '',
    password_confirmation: '',
    admin: false,
    ...initialData,
  });

  const [validated, setValidated] = useState<{
    login: 'success' | 'error' | 'default';
    mail: 'success' | 'error' | 'default';
    password: 'success' | 'error' | 'default';
    password_confirmation: 'success' | 'error' | 'default';
  }>({
    login: 'default',
    mail: 'default',
    password: 'default',
    password_confirmation: 'default',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateField = (field: keyof typeof validated, value: string) => {
    switch (field) {
      case 'login':
        return value.trim().length >= 3 ? 'success' : 'error';
      case 'mail':
        return !value || VALIDATION_PATTERNS.EMAIL.test(value) 
          ? 'success' 
          : 'error';
      case 'password':
        if (!showPasswordFields || isEdit) return 'success';
        return value.length >= 8 ? 'success' : 'error';
      case 'password_confirmation':
        if (!showPasswordFields || isEdit) return 'success';
        return value === formData.password ? 'success' : 'error';
      default:
        return 'default';
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (typeof value === 'string' && (field === 'login' || field === 'mail' || field === 'password' || field === 'password_confirmation')) {
      setValidated(prev => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const loginValid = validateField('login', formData.login);
    const mailValid = validateField('mail', formData.mail || '');
    const passwordValid = validateField('password', formData.password || '');
    const passwordConfirmationValid = validateField('password_confirmation', formData.password_confirmation || '');
    
    setValidated({
      login: loginValid,
      mail: mailValid,
      password: passwordValid,
      password_confirmation: passwordConfirmationValid,
    });

    const isValid = [loginValid, mailValid, passwordValid, passwordConfirmationValid]
      .every(v => v === 'success');

    if (isValid) {
      // Remove password fields if they're empty in edit mode
      const submitData = { ...formData };
      if (isEdit && !submitData.password) {
        delete submitData.password;
        delete submitData.password_confirmation;
      }
      onSubmit(submitData);
    }
  };

  return (
    <Card>
      <CardTitle>{isEdit ? 'Edit User' : 'Add User'}</CardTitle>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" title="Form submission failed" isInline className="pf-v5-u-mb-md">
              {error}
            </Alert>
          )}

          <Grid hasGutter>
            <GridItem span={6}>
              <FormGroup
                label="Username"
                isRequired
                fieldId="login"
              >
                <TextInput
                  isRequired
                  type="text"
                  id="login"
                  name="login"
                  value={formData.login}
                  onChange={(_event, value) => handleInputChange('login', value)}
                  validated={validated.login}
                  placeholder="Enter username"
                />
                {validated.login === 'error' && (
                  <HelperText>
                    <HelperTextItem variant="error">
                      Username must be at least 3 characters long
                    </HelperTextItem>
                  </HelperText>
                )}
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup
                label="Email"
                fieldId="mail"
              >
                <TextInput
                  type="email"
                  id="mail"
                  name="mail"
                  value={formData.mail || ''}
                  onChange={(_event, value) => handleInputChange('mail', value)}
                  validated={validated.mail}
                  placeholder="Enter email address"
                />
                {validated.mail === 'error' && (
                  <HelperText>
                    <HelperTextItem variant="error">
                      Please enter a valid email address
                    </HelperTextItem>
                  </HelperText>
                )}
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup
                label="First Name"
                fieldId="firstname"
              >
                <TextInput
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname || ''}
                  onChange={(_event, value) => handleInputChange('firstname', value)}
                  placeholder="Enter first name"
                />
              </FormGroup>
            </GridItem>

            <GridItem span={6}>
              <FormGroup
                label="Last Name"
                fieldId="lastname"
              >
                <TextInput
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname || ''}
                  onChange={(_event, value) => handleInputChange('lastname', value)}
                  placeholder="Enter last name"
                />
              </FormGroup>
            </GridItem>

            {showPasswordFields && (
              <>
                <GridItem span={6}>
                  <FormGroup
                    label="Password"
                    isRequired={!isEdit}
                    fieldId="password"
                  >
                    <TextInput
                      isRequired={!isEdit}
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password || ''}
                      onChange={(_event, value) => handleInputChange('password', value)}
                      validated={validated.password}
                      placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                    />
                    {validated.password === 'error' && (
                      <HelperText>
                        <HelperTextItem variant="error">
                          Password must be at least 8 characters long
                        </HelperTextItem>
                      </HelperText>
                    )}
                  </FormGroup>
                </GridItem>

                <GridItem span={6}>
                  <FormGroup
                    label="Confirm Password"
                    isRequired={!isEdit && !!formData.password}
                    fieldId="password_confirmation"
                  >
                    <TextInput
                      isRequired={!isEdit && !!formData.password}
                      type="password"
                      id="password_confirmation"
                      name="password_confirmation"
                      value={formData.password_confirmation || ''}
                      onChange={(_event, value) => handleInputChange('password_confirmation', value)}
                      validated={validated.password_confirmation}
                      placeholder="Confirm password"
                    />
                    {validated.password_confirmation === 'error' && (
                      <HelperText>
                        <HelperTextItem variant="error">
                          Passwords do not match
                        </HelperTextItem>
                      </HelperText>
                    )}
                  </FormGroup>
                </GridItem>
              </>
            )}

            <GridItem span={12}>
              <FormGroup fieldId="admin">
                <Checkbox
                  id="admin"
                  name="admin"
                  label="Administrator"
                  description="Grant administrator privileges to this user"
                  isChecked={formData.admin || false}
                  onChange={(_event, checked) => handleInputChange('admin', checked)}
                />
              </FormGroup>
            </GridItem>
          </Grid>

          <ActionGroup>
            <Button
              type="submit"
              variant="primary"
              isDisabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
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