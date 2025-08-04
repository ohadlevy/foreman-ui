import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FOREMAN_BRANDING, useAuth, ModeProvider } from '@foreman/shared';
import { StandaloneLogin } from './pages/StandaloneLogin';
import { UserApp } from './UserApp';
import { pluginLoader } from './plugins/pluginLoader';

// Import admin portal - for now, just show a placeholder
const AdminApp = React.lazy(() => 
  Promise.resolve({
    default: () => (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Admin Portal</h1>
        <p>The admin portal is currently under development.</p>
        <p>This will contain the full Foreman administrative interface.</p>
      </div>
    )
  })
);

// App component that has access to auth context (wrapped by AuthProvider in main.tsx)
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize plugin system
  React.useEffect(() => {
    const initializePlugins = async () => {
      await pluginLoader.initialize();
    };
    initializePlugins();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: `linear-gradient(135deg, ${FOREMAN_BRANDING.colors.primary} 0%, ${FOREMAN_BRANDING.colors.primaryGradientStart} 50%, ${FOREMAN_BRANDING.colors.secondary} 100%)`
      }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Verifying authentication</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <StandaloneLogin />;
  }

  return (
    <ModeProvider>
      <React.Suspense fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh'
        }}>
          <div>Loading...</div>
        </div>
      }>
        <Routes>
          {/* Default redirect to user mode */}
          <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
          <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
          <Route path="/hosts" element={<Navigate to="/user/hosts" replace />} />
          <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/user/settings" replace />} />
          <Route path="/system-status" element={<Navigate to="/user/system-status" replace />} />
          <Route path="/login" element={<Navigate to="/user/dashboard" replace />} />
          
          {/* User mode routes */}
          <Route path="/user/*" element={<UserApp />} />
          
          {/* Admin mode routes */}
          <Route path="/admin/*" element={<AdminApp />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </Routes>
      </React.Suspense>
    </ModeProvider>
  );
}

export default App;