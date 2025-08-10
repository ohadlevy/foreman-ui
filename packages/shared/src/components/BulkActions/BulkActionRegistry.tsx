import React from 'react';
import { ComponentExtension, EXTENSION_POINTS, BulkActionExtensionProps, ExtensionComponentProps } from '../../plugins/types';
import { BulkAction } from '../../types';

// Factory function to create bulk action component
const createBulkActionComponent = (
  actionConfig: Omit<BulkAction, 'action'> & {
    component?: React.ComponentType<BulkActionExtensionProps>;
  }
) => {
  const BulkActionComponent: React.FC<ExtensionComponentProps> = (props) => {
    // Cast props to the bulk action specific props
    const bulkProps = props as unknown as BulkActionExtensionProps;
    const { selectedItems, allItems, onComplete } = bulkProps;

    if (actionConfig.component) {
      const Component = actionConfig.component;
      return (
        <Component
          selectedItems={selectedItems}
          allItems={allItems}
          onComplete={onComplete}
        />
      );
    }

    // For simple actions without custom components, just return null
    // The actual action will be handled in the modal/toolbar
    return null;
  };

  return BulkActionComponent;
};

/**
 * Helper function to create bulk action extensions for plugins
 */
export const createBulkActionExtension = (
  actionConfig: Omit<BulkAction, 'action'> & {
    component?: React.ComponentType<BulkActionExtensionProps>;
  }
): ComponentExtension => {
  return {
    extensionPoint: EXTENSION_POINTS.HOST_BULK_ACTIONS,
    component: createBulkActionComponent(actionConfig),
    title: actionConfig.label,
    permissions: actionConfig.permissions,
    props: {
      ...actionConfig,
      action: async (selectedIds: number[]) => {
        // Default action returns success for all items
        return { success_count: selectedIds.length, failed_count: 0 };
      },
    },
  };
};

/**
 * Example bulk actions that plugins can register
 */
export const examplePluginBulkActions = {
  /**
   * Example: Ansible plugin bulk action
   */
  ansiblePlaybook: createBulkActionExtension({
    id: 'ansible-run-playbook',
    label: 'Run Ansible Playbook',
    permissions: ['execute_ansible'],
    requiresConfirmation: true,
    confirmationTitle: 'Run Ansible Playbook',
    confirmationMessage: 'This will execute the selected playbook on all selected hosts.',
    destructive: false,
  }),

  /**
   * Example: Remote Execution plugin bulk action
   */
  remoteExecution: createBulkActionExtension({
    id: 'remote-execution-run',
    label: 'Run Remote Command',
    permissions: ['execute_remote_commands'],
    requiresConfirmation: true,
    confirmationTitle: 'Execute Remote Command',
    confirmationMessage: 'This will run the command on all selected hosts.',
    destructive: false,
  }),

  /**
   * Example: Katello plugin bulk action
   */
  katelloUpdate: createBulkActionExtension({
    id: 'katello-update-packages',
    label: 'Update Packages',
    permissions: ['edit_hosts', 'view_content_hosts'],
    requiresConfirmation: true,
    confirmationTitle: 'Update Packages',
    confirmationMessage: 'This will update packages on all selected hosts.',
    destructive: false,
  }),

  /**
   * Example: OpenSCAP plugin bulk action
   */
  openscapScan: createBulkActionExtension({
    id: 'openscap-run-scan',
    label: 'Run OpenSCAP Scan',
    permissions: ['view_arf_reports', 'create_arf_reports'],
    requiresConfirmation: true,
    confirmationTitle: 'Run Security Scan',
    confirmationMessage: 'This will run an OpenSCAP security scan on all selected hosts.',
    destructive: false,
  }),
};