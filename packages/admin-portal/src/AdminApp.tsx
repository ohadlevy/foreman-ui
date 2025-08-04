import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@foreman/shared';
import { Overview } from './pages/Overview';
import { SmartProxies } from './pages/SmartProxies';
import { Users } from './pages/Users';
import { AdminSettings } from './pages/AdminSettings';

export const AdminApp: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        
        {/* Admin routes */}
        <Route path="/admin/overview" element={<Overview />} />
        
        {/* Infrastructure */}
        <Route path="/admin/infrastructure/smart-proxies" element={<SmartProxies />} />
        
        {/* User Management */}
        <Route path="/admin/users" element={<Users />} />
        
        {/* Configuration */}
        <Route path="/admin/settings" element={<AdminSettings />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin/overview" replace />} />
      </Routes>
    </AdminLayout>
  );
};