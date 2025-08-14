import React from 'react';
import {
  Card,
  CardBody,
  Title,
} from '@patternfly/react-core';
import { useAuth, LoginForm, FOREMAN_BRANDING, FOREMAN_URLS, getSystemTheme } from '@foreman/shared';
import { useNavigate } from 'react-router-dom';
import { useUserSettingsStore, applyThemeToDocument } from '../stores/userSettingsStore';

export const Login: React.FC = () => {
  const { login, isLoginLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { getCurrentUserSettings } = useUserSettingsStore();
  
  // Get current theme setting for login page styling
  const currentSettings = getCurrentUserSettings();
  
  // Memoized theme resolution to avoid recalculation on every render
  const resolvedTheme = React.useMemo(() => {
    if (currentSettings.theme === 'dark') {
      return 'dark';
    } else if (currentSettings.theme === 'light') {
      return 'light';
    } else {
      // System theme - use utility function for SSR safety
      return getSystemTheme();
    }
  }, [currentSettings.theme]);
  
  // Apply theme using existing logic from userSettingsStore
  React.useEffect(() => {
    applyThemeToDocument(resolvedTheme);
    // No cleanup needed as applyThemeToDocument handles all theme state
  }, [resolvedTheme]);

  const handleLogin = async (credentials: { login: string; password: string }) => {
    try {
      await login(credentials);
      navigate('/dashboard');
    } catch {
      // Error is handled by the auth store
    }
  };

  return (
    <main
      className="foreman-login-page"
      data-testid="login-page"
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
          borderRadius: '24px', // PatternFly v6 rounded corners
          border: 'none',
        }}
      >
        <CardBody className="pf-v6-u-p-2xl">
          {/* Header with branding */}
          <div className="pf-v6-u-text-align-center pf-v6-u-mb-2xl">
            <div className="pf-v6-u-mb-lg">
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
            <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-sm">
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
            clearError={clearError}
          />

          {/* Footer message */}
          <div className="pf-v6-u-text-align-center pf-v6-u-mt-xl pf-v6-u-font-size-sm pf-v6-u-color-200">
            Need an account? Contact your system administrator.
          </div>

          {/* Links */}
          <div 
            className="pf-v6-u-text-align-center pf-v6-u-mt-lg foreman-login-links"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            } as React.CSSProperties}
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
    </main>
  );
};