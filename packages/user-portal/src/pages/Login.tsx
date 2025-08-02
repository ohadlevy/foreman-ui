import React from 'react';
import {
  LoginPage as PFLoginPage,
  LoginMainFooterBandItem,
  LoginMainFooterLinksItem,
  ListItem,
  ListVariant,
} from '@patternfly/react-core';
import { useAuth, LoginForm as ForemanLoginForm } from '@foreman/shared';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, isLoginLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: { login: string; password: string }) => {
    try {
      await login(credentials);
      navigate('/dashboard');
    } catch {
      // Error is handled by the auth store
    }
  };

  const loginForm = (
    <ForemanLoginForm
      onSubmit={handleLogin}
      isLoading={isLoginLoading}
      error={error}
    />
  );

  const signUpForAccountMessage = (
    <LoginMainFooterBandItem>
      Need an account? Contact your system administrator.
    </LoginMainFooterBandItem>
  );

  const forgotCredentials = (
    <LoginMainFooterBandItem>
      <a href="#forgot-password">Forgot username or password?</a>
    </LoginMainFooterBandItem>
  );

  const listItem = (
    <>
      <ListItem>
        <LoginMainFooterLinksItem href="#help">
          Need help?
        </LoginMainFooterLinksItem>
      </ListItem>
      <ListItem>
        <LoginMainFooterLinksItem href="#privacy">
          Privacy policy
        </LoginMainFooterLinksItem>
      </ListItem>
      <ListItem>
        <LoginMainFooterLinksItem href="#terms">
          Terms of use
        </LoginMainFooterLinksItem>
      </ListItem>
    </>
  );

  return (
    <PFLoginPage
      footerListVariants={ListVariant.inline}
      brandImgSrc="/logo.svg"
      brandImgAlt="Foreman logo"
      backgroundImgSrc="/images/background.jpg"
      footerListItems={listItem}
      textContent="This is placeholder text only. Use this area to place any information or introductory message about your application that may be relevant to users."
      loginTitle="Log in to your account"
      loginSubtitle="Enter your credentials to access Foreman User Portal"
      signUpForAccountMessage={signUpForAccountMessage}
      forgotCredentials={forgotCredentials}
    >
      {loginForm}
    </PFLoginPage>
  );
};