import React from 'react';
import {
  Card,
  CardBody,
  Title,
} from '@patternfly/react-core';
import { useAuth, LoginForm, FOREMAN_BRANDING, FOREMAN_URLS } from '@foreman/shared';
import { useNavigate } from 'react-router-dom';

export const SimpleLogin: React.FC = () => {
  const { login, isLoginLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: { login: string; password: string }) => {
    try {
      await login(credentials);
      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the auth store
      console.error('Login failed:', err);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        padding: '1rem',
        background: `linear-gradient(135deg, ${FOREMAN_BRANDING.colors.primary} 0%, ${FOREMAN_BRANDING.colors.primaryGradientStart} 50%, ${FOREMAN_BRANDING.colors.secondary} 100%)`,
      }}
    >
        <Card
          style={{
            width: '500px',
            maxWidth: '31.25rem', // Same as PatternFly LoginPage
            margin: '0 auto',
            boxShadow: 'var(--pf-v6-global--BoxShadow--lg)',
            borderRadius: '24px', // Same as PatternFly v6
            border: 'none',
          }}
        >
          <CardBody style={{ padding: '3rem 2rem' }}>
            {/* Header with branding */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={FOREMAN_BRANDING.logoPath}
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
                  color: 'var(--pf-v6-global--Color--200)',
                  lineHeight: '1.4',
                }}
              >
                Enter your Foreman credentials
              </div>
            </div>

            {/* Login form */}
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoginLoading}
              error={error}
            />

            {/* Footer message */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '1.5rem',
                fontSize: '14px',
                color: 'var(--pf-v6-global--Color--200)',
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
    </div>
  );
};