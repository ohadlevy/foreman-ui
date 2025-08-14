import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout, FOREMAN_BRANDING, PluginRouter } from '@foreman/shared';
import { Dashboard } from './pages/Dashboard';
import { HostsList } from './pages/Hosts/HostsList';
import { HostDetails } from './pages/Hosts/HostDetails';
import { CreateHost } from './pages/Hosts/CreateHost';
import { Registration } from './pages/Registration';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { SystemStatus } from './pages/SystemStatus';
import { Login } from './pages/Login';
import { useAuth } from '@foreman/shared';
import { pluginLoader } from './plugins/pluginLoader';
import { useUserSettingsInitializer } from './hooks/useUserSettingsInitializer';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize user settings when auth state changes
  useUserSettingsInitializer();

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
    return <Login />;
  }

  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hosts" element={<HostsList />} />
        <Route path="/hosts/new" element={<CreateHost />} />
        <Route path="/hosts/:id" element={<HostDetails />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/system-status" element={<SystemStatus />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        {/* Plugin Routes */}
        <Route path="/*" element={<PluginRouter />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UserLayout>
  );
}

export default App;