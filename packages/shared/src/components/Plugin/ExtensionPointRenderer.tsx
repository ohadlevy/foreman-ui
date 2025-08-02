import React from 'react';
import { usePluginExtensions } from '../../plugins/hooks';
import { useAuthStore } from '../../auth/store';
import { filterExtensionsByPermissions } from '../../plugins/utils';
import { ExtensionPointName } from '../../plugins/types';

interface ExtensionPointRendererProps {
  /** Extension point identifier */
  extensionPoint: ExtensionPointName;
  /** Context data to pass to extension components */
  context?: unknown;
  /** Optional wrapper component for extensions */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Additional props to pass to extension components */
  extensionProps?: Record<string, unknown>;
}

/**
 * Component that renders all plugin extensions for a specific extension point
 * Handles permission filtering and context passing
 */
export const ExtensionPointRenderer: React.FC<ExtensionPointRendererProps> = ({
  extensionPoint,
  context,
  wrapper: Wrapper,
  extensionProps = {}
}) => {
  const extensions = usePluginExtensions(extensionPoint);
  const { user } = useAuthStore();
  
  // Get user permissions for filtering
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];
  
  // Filter extensions by permissions and conditions
  const filteredExtensions = filterExtensionsByPermissions(
    extensions, 
    userPermissions, 
    context
  );
  
  if (filteredExtensions.length === 0) {
    return null;
  }
  
  const renderExtension = (extension: typeof extensions[0], index: number) => {
    const ExtensionComponent = extension.component;
    
    // Prepare props for the extension component
    const props = {
      context,
      extensionPoint,
      ...extensionProps
    };
    
    const element = <ExtensionComponent key={`${extensionPoint}-${index}`} {...props} />;
    
    return Wrapper ? <Wrapper key={`wrapper-${extensionPoint}-${index}`}>{element}</Wrapper> : element;
  };
  
  return (
    <>
      {filteredExtensions.map((extension, index) => renderExtension(extension, index))}
    </>
  );
};

export default ExtensionPointRenderer;