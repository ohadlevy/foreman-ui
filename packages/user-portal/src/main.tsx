import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, ErrorBoundary, configureTranslationService } from '@foreman/shared';
import App from './App';
import initI18n from './i18n';

// Import PatternFly CSS
import '@patternfly/patternfly/patternfly.css';

// Initialize i18next before React renders
const startApp = async () => {
  // Ensure i18next is fully initialized
  const i18nInstance = await initI18n();
  
  // Double-check initialization completed - only log in development
  if (!i18nInstance.isInitialized && process.env.NODE_ENV === 'development') {
    console.debug('i18next initialization may not be complete');
  }

  // Configure the shared translation service with our initialized i18next instance
  configureTranslationService(i18nInstance);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
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