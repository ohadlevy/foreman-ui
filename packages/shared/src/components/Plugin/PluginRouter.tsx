import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePluginRoutes } from '../../plugins/hooks';
import { useAuthStore } from '../../auth/store';
import { hasPluginPermissions } from '../../plugins/utils';

/**
 * Router component that renders plugin-provided routes
 * Handles permission checking and route rendering
 */
export const PluginRouter: React.FC = () => {
  const pluginRoutes = usePluginRoutes();
  const { user } = useAuthStore();
  
  // Get user permissions for filtering
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];
  
  return (
    <Routes>
      {pluginRoutes.map((route, index) => {
        // Check if user has required permissions for this route
        const hasPermission = hasPluginPermissions(route.permissions, userPermissions);
        
        if (!hasPermission) {
          return null;
        }
        
        return (
          <Route
            key={`${route.pluginName}-${route.path}`}
            path={route.path}
            element={
              <route.element 
                pluginName={route.pluginName}
                pluginDisplayName={route.pluginDisplayName}
              />
            }
          />
        );
      })}
    </Routes>
  );
};

export default PluginRouter;