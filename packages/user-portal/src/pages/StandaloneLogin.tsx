import React, { useState } from 'react';
import {
  Page,
  PageSection,
  Card,
  CardBody,
  Title,
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  InputGroup,
  InputGroupItem,
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { FOREMAN_BRANDING, FOREMAN_URLS, createDefaultClient, AuthAPI, useAuthStore } from '@foreman/shared';

export const StandaloneLogin: React.FC = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.login.trim() || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create API client and auth API directly
      const apiClient = createDefaultClient();
      const authAPI = new AuthAPI(apiClient);
      
      // Attempt login
      const response = await authAPI.login(credentials);
      
      // Use the auth store to properly set authentication state
      authStore.login(response.user, response.token);
      
      // Navigate to dashboard without forcing a full page reload
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const message = errorObj?.response?.data?.error?.message || errorObj?.message || 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <PageSection
        isFilled
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${FOREMAN_BRANDING.colors.primary} 0%, ${FOREMAN_BRANDING.colors.primaryGradientStart} 50%, ${FOREMAN_BRANDING.colors.secondary} 100%)`,
        }}
      >
        <Card
          style={{
            width: '500px',
            maxWidth: '31.25rem',
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            borderRadius: '24px',
            border: 'none',
          }}
        >
          <CardBody style={{ padding: '3rem 2rem' }}>
            {/* Header with branding */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <img 
                  src="/assets/foreman-logo.svg" 
                  alt="Foreman" 
                  style={{ 
                    height: '80px', 
                    width: 'auto',
                    maxWidth: '100%'
                  }} 
                />
              </div>
              <Title headingLevel="h1" size="xl" style={{ marginBottom: '0.5rem' }}>
                Sign in to your account
              </Title>
              <div
                style={{
                  fontSize: '14px',
                  color: '#6c757d',
                  lineHeight: '1.4',
                }}
              >
                Enter your Foreman credentials
              </div>
            </div>

            {/* Error alert */}
            {error && (
              <Alert
                variant="danger"
                title="Login failed"
                style={{ marginBottom: '1rem' }}
                isInline
              >
                {error}
              </Alert>
            )}

            {/* Login form */}
            <Form onSubmit={handleSubmit}>
              <FormGroup
                label="Username"
                isRequired
                fieldId="login"
              >
                <TextInput
                  id="login"
                  name="login"
                  type="text"
                  value={credentials.login}
                  onChange={(_event, value) => setCredentials(prev => ({ ...prev, login: value }))}
                  isRequired
                  autoComplete="username"
                  placeholder="Enter your username"
                />
              </FormGroup>

              <FormGroup
                label="Password"
                isRequired
                fieldId="password"
              >
                <InputGroup>
                  <InputGroupItem isFill>
                    <TextInput
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(_event, value) => setCredentials(prev => ({ ...prev, password: value }))}
                      isRequired
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                  </InputGroupItem>
                  <InputGroupItem>
                    <Button
                      variant="control"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </Button>
                  </InputGroupItem>
                </InputGroup>
              </FormGroup>

              <div style={{ marginTop: '2rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  isBlock
                  isLoading={isLoading}
                  isDisabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </Form>

            {/* Footer message */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '1.5rem',
                fontSize: '14px',
                color: '#6c757d',
              }}
            >
              Need an account? Contact your system administrator.
            </div>

            {/* Links */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <a
                href={FOREMAN_URLS.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: FOREMAN_BRANDING.colors.primary,
                  textDecoration: 'none',
                }}
              >
                About Foreman
              </a>
              <a
                href={FOREMAN_URLS.documentation}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: FOREMAN_BRANDING.colors.primary,
                  textDecoration: 'none',
                }}
              >
                Documentation
              </a>
              <a
                href={FOREMAN_URLS.community}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: FOREMAN_BRANDING.colors.primary,
                  textDecoration: 'none',
                }}
              >
                Need help?
              </a>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};