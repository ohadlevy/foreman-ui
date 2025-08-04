import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, ErrorBoundary, configureTranslationService } from '@foreman/shared';
import App from './App';
import initI18n, { i18next } from './i18n';

// Import PatternFly CSS
import '@patternfly/patternfly/patternfly.css';

// Initialize i18next before React renders
const startApp = async () => {
  await initI18n();

  // Configure the shared translation service with our initialized i18next instance
  configureTranslationService(i18next);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider requireAuth>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

startApp().catch(console.error);