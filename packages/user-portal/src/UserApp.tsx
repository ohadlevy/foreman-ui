import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout, PluginRouter } from '@foreman/shared';
import { Dashboard } from './pages/Dashboard';
import { HostsList } from './pages/Hosts/HostsList';
import { HostDetails } from './pages/Hosts/HostDetails';
import { CreateHost } from './pages/Hosts/CreateHost';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { SystemStatus } from './pages/SystemStatus';

export const UserApp: React.FC = () => {
  return (
    <UserLayout>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        
        {/* User routes - note: these are relative paths since we're already in /user/* */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="hosts" element={<HostsList />} />
        <Route path="hosts/new" element={<CreateHost />} />
        <Route path="hosts/:id" element={<HostDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="system-status" element={<SystemStatus />} />
        
        {/* Plugin Routes */}
        <Route path="*" element={<PluginRouter />} />
      </Routes>
    </UserLayout>
  );
};