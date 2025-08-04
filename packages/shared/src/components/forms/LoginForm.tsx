import React, { useState } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  ActionGroup,
} from '@patternfly/react-core';
import { LoginCredentials } from '../../types';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ login, password });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" title="Login failed" isInline className="pf-v5-u-mb-md">
          {error}
        </Alert>
      )}

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
          value={login}
          onChange={(_event, value) => setLogin(value)}
          autoComplete="username"
        />
      </FormGroup>

      <FormGroup
        label="Password"
        isRequired
        fieldId="password"
      >
        <TextInput
          isRequired
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(_event, value) => setPassword(value)}
          autoComplete="current-password"
        />
      </FormGroup>

      <ActionGroup>
        <Button
          type="submit"
          variant="primary"
          isDisabled={isLoading || !login || !password}
          isLoading={isLoading}
          style={{ width: '100%' }}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </ActionGroup>
    </Form>
  );
};