import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  SearchInput,
  Pagination,
  Card,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Divider,
  Modal,
  ModalVariant,
  Checkbox,
  Form,
  FormGroup,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import {
  PlusIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TimesCircleIcon,
  HistoryIcon,
  CogIcon,
  TrashIcon,
  EditIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  useMyHosts,
  formatDateTime,
  formatRelativeTime,
  LoadingSpinner,
  usePermissions,
  RecentHosts,
  RecentSearches,
  useActivityStore,
  pluginRegistry,
  EXTENSION_POINTS,
  HostTableColumnProps,
  ExtensionComponentProps,
  useBulkSelection,
  BulkActionToolbar,
  BulkActionModal,
  useBulkDeleteHosts,
  useBulkUpdateHostGroup,
  useHostGroups,
  BulkAction,
  BulkOperationResult,
} from '@foreman/shared';
import { Host } from '@foreman/shared';

// Column type definition
interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  source: 'core' | 'plugin';
  plugin?: string;
  component?: React.ComponentType<ExtensionComponentProps>;
}

// Base columns configuration - moved outside component for performance
const BASE_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', enabled: true, required: true, source: 'core' },
  { key: 'status', label: 'Status', enabled: true, required: false, source: 'core' },
  { key: 'operatingsystem', label: 'Operating System', enabled: true, required: false, source: 'core' },
  { key: 'ip', label: 'IP Address', enabled: true, required: false, source: 'core' },
  { key: 'last_report', label: 'Last Report', enabled: true, required: false, source: 'core' },
  { key: 'created_at', label: 'Created', enabled: true, required: false, source: 'core' },
  { key: 'environment', label: 'Environment', enabled: false, required: false, source: 'core' },
  { key: 'hostgroup', label: 'Host Group', enabled: false, required: false, source: 'core' },
  { key: 'owner', label: 'Owner', enabled: false, required: false, source: 'core' },
  { key: 'location', label: 'Location', enabled: false, required: false, source: 'core' },
  { key: 'organization', label: 'Organization', enabled: false, required: false, source: 'core' },
];

// Type guard to validate plugin components - moved outside component for performance
const isValidHostTableComponent = (component: unknown): component is React.ComponentType<HostTableColumnProps> => {
  // Check if it's a function (function component or class constructor)
  if (typeof component === 'function') {
    return true;
  }

  // Check if it's a valid React element type (forwardRef, memo, etc.)
  if (
    typeof component === 'object' &&
    component !== null &&
    '$$typeof' in component
  ) {
    const reactElement = component as { $$typeof?: symbol };
    return (
      reactElement.$$typeof === Symbol.for('react.forward_ref') ||
      reactElement.$$typeof === Symbol.for('react.memo')
    );
  }

  return false;
};

// Helper function to convert Host to HostTableColumnProps['host'] - moved outside component for performance
const convertHostForPlugin = (host: Host): HostTableColumnProps['host'] => {
  // Return the host object with all properties, ensuring compatibility with plugin interface
  return {
    ...host,
    // Ensure required properties are explicitly defined for type safety
    // Use host.id directly if it exists, otherwise don't provide a default to catch issues
    id: host.id,
    name: host.name ?? '',
    enabled: host.enabled ?? false,
    build: host.build ?? false,
  };
};

// Robust sanitization function for plugin titles - moved outside component for performance
const sanitizePluginTitle = (title: string): string => {
  return title
    .trim()
    .toLowerCase()
    // Replace sequences of non-alphanumeric characters with single underscore
    .replace(/[^a-z0-9]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '')
    // Ensure result is not empty
    || 'plugin';
};

export const HostsList: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateHosts } = usePermissions();
  const { addActivity } = useActivityStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState<{
    isOpen: boolean;
    action?: BulkAction;
  }>({ isOpen: false });

  // Data fetching - moved to top for better readability
  const { data, isLoading, error } = useMyHosts({
    search,
    page,
    per_page: perPage,
  });

  const hosts = data?.results || [];
  const total = data?.total || 0;

  // Bulk selection management
  const bulkSelection = useBulkSelection({ items: hosts });

  // Bulk operation hooks
  const bulkDeleteMutation = useBulkDeleteHosts();
  const bulkUpdateHostGroupMutation = useBulkUpdateHostGroup();
  const { data: hostGroups } = useHostGroups();

  // Track plugin registry changes to update columns when plugins are loaded/unloaded
  const [pluginRegistryVersion, setPluginRegistryVersion] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = pluginRegistry.subscribe(() => {
      setPluginRegistryVersion(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Core bulk actions
  const coreBulkActions: BulkAction[] = React.useMemo(() => [
    {
      id: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      action: async (selectedIds: number[]) => {
        return bulkDeleteMutation.mutateAsync(selectedIds);
      },
      permissions: ['destroy_hosts'],
      requiresConfirmation: true,
      confirmationTitle: 'Delete Hosts',
      confirmationMessage: 'Are you sure you want to delete the selected hosts? This action cannot be undone.',
      destructive: true,
    },
    {
      id: 'change-hostgroup',
      label: 'Change Host Group',
      icon: EditIcon,
      action: async (selectedIds: number[], parameters?: Record<string, unknown>) => {
        const hostgroupId = parameters?.hostgroup_id as number;
        if (!hostgroupId) {
          throw new Error('Host group is required');
        }
        return bulkUpdateHostGroupMutation.mutateAsync({ hostIds: selectedIds, hostgroupId });
      },
      permissions: ['edit_hosts'],
      requiresConfirmation: true,
      confirmationTitle: 'Change Host Group',
      confirmationMessage: 'This will change the host group for all selected hosts.',
      destructive: false,
    },
  ], [bulkDeleteMutation, bulkUpdateHostGroupMutation]);

  // Get plugin bulk actions
  const pluginBulkActions = React.useMemo(() => {
    const extensions = pluginRegistry.getPluginsWithExtensions(EXTENSION_POINTS.HOST_BULK_ACTIONS);
    return extensions.map((ext): BulkAction => ({
      id: ext.title || 'plugin-action',
      label: ext.title || 'Plugin Action',
      action: async (selectedIds: number[]) => {
        // Plugin actions would be handled through the extension component
        return { success_count: selectedIds.length, failed_count: 0 };
      },
      permissions: ext.permissions || [],
      ...ext.props,
    }));
  }, [pluginRegistryVersion]);

  // Combine all bulk actions
  const bulkActions = React.useMemo(() => [
    ...coreBulkActions,
    ...pluginBulkActions,
  ], [coreBulkActions, pluginBulkActions]);

  // Bulk action handlers
  const handleBulkActionClick = (action: BulkAction) => {
    setBulkActionModal({ isOpen: true, action });
  };

  const handleBulkActionConfirm = async (parameters?: Record<string, unknown>): Promise<BulkOperationResult> => {
    if (!bulkActionModal.action) {
      throw new Error('No action selected');
    }

    const result = await bulkActionModal.action.action(bulkSelection.selectedIds, parameters);
    bulkSelection.clearSelection();
    return result;
  };

  const handleBulkActionModalClose = () => {
    setBulkActionModal({ isOpen: false });
  };

  // Memoized plugin columns to avoid expensive calls on every render
  const pluginColumns = React.useMemo(() => {
    const extensions = pluginRegistry.getPluginsWithExtensions(EXTENSION_POINTS.HOST_TABLE_COLUMNS);
    return extensions.map((ext, index) => {
      const { key: propKey, label: propLabel, ...otherProps } = ext.props || {};

      // Generate stable, deterministic keys for plugin columns
      // Priority: explicit key -> extension point + title -> extension point + order -> fallback
      let stableKey: string;
      if (propKey && typeof propKey === 'string') {
        stableKey = propKey;
      } else if (ext.title) {
        // Create deterministic key from extension point and title
        const sanitizedTitle = sanitizePluginTitle(ext.title);
        stableKey = `${ext.extensionPoint}_${sanitizedTitle}`;
      } else if (ext.order !== undefined) {
        // Use order if available for deterministic positioning
        stableKey = `${ext.extensionPoint}_order_${ext.order}`;
      } else {
        // Fallback to index-based key with warning
        stableKey = `${ext.extensionPoint}_index_${index}`;
        console.warn(`Plugin column using index-based key: ${stableKey}`);
      }

      const pluginName = ext.title || 'Unknown Plugin';

      return {
        key: stableKey,
        label: ext.title || propLabel || 'Plugin Column',
        enabled: false,
        required: false,
        source: 'plugin' as const,
        plugin: pluginName,
        component: ext.component,
        ...otherProps
      } as ColumnConfig;
    });
  }, [pluginRegistryVersion]);
  // pluginRegistryVersion is intentionally included to trigger re-computation when plugins are loaded/unloaded

  // Combine base and plugin columns - memoized to prevent unnecessary recalculations
  const allAvailableColumns = React.useMemo(() => {
    return [...BASE_COLUMNS, ...pluginColumns];
  }, [pluginColumns]);

  // Load saved column preferences from localStorage
  const loadColumnPreferences = React.useCallback(() => {
    try {
      const saved = localStorage.getItem('hostlist-columns');
      if (saved) {
        const savedColumns = JSON.parse(saved);

        // Merge saved preferences with available columns
        return allAvailableColumns.map(col => {
          const savedCol = savedColumns.find((s: { key: string; enabled: boolean }) => s.key === col.key);
          return savedCol ? { ...col, enabled: savedCol.enabled } : col;
        });
      }
    } catch (error) {
      // localStorage can fail due to JSON parsing errors, security restrictions,
      // or when accessing localStorage in environments where it's not available
      console.warn('Failed to load column preferences from localStorage:', error);
    }
    return allAvailableColumns;
  }, [allAvailableColumns]);

  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  // Load column preferences after mount and when available columns change
  useEffect(() => {
    setColumns(loadColumnPreferences());
  }, [loadColumnPreferences]);

  // Save column preferences to localStorage - memoized to prevent unnecessary re-renders
  const saveColumnPreferences = React.useCallback((newColumns: typeof columns) => {
    try {
      const columnsToSave = newColumns.map(col => ({
        key: col.key,
        enabled: col.enabled
      }));
      localStorage.setItem('hostlist-columns', JSON.stringify(columnsToSave));
    } catch (error) {
      // localStorage can fail in private browsing mode, when storage is full,
      // or when storage access is restricted by browser security policies
      console.warn('Failed to save column preferences to localStorage:', error);
    }
  }, []); // No dependencies - function only uses parameters and doesn't close over state

  // Toggle column visibility - memoized to prevent unnecessary re-renders
  const toggleColumn = React.useCallback((columnKey: string) => {
    setColumns(prev => {
      const newColumns = prev.map(col =>
        col.key === columnKey ? { ...col, enabled: !col.enabled } : col
      );
      saveColumnPreferences(newColumns);
      return newColumns;
    });
  }, [saveColumnPreferences]);

  // Get enabled columns
  const enabledColumns = columns.filter(col => col.enabled);


  // Track page visit
  useEffect(() => {
    addActivity({
      type: 'page_visit',
      title: 'My Hosts',
      subtitle: 'Host management',
      url: '/hosts',
    });
  }, [addActivity]);

  // Track search activities
  useEffect(() => {
    if (search && !isLoading && data) {
      // No need to sanitize search input for XSS here, as it is not rendered as HTML
      if (search.trim()) {
        addActivity({
          type: 'search',
          title: search.trim(),
          subtitle: `${data.total} results`,
          url: `/hosts?search=${encodeURIComponent(search.trim())}`,
          metadata: { query: search.trim(), resultCount: data.total },
        });
      }
    }
  }, [search, isLoading, data, addActivity]);

  const getStatusIcon = React.useCallback((host: Host) => {
    if (host.build) {
      return <ExclamationTriangleIcon color="orange" />;
    }
    if (host.enabled) {
      return <CheckCircleIcon color="green" />;
    }
    return <TimesCircleIcon color="red" />;
  }, []);

  const getStatusText = React.useCallback((host: Host) => {
    if (host.build) return 'Building';
    if (host.enabled) return 'Running';
    return 'Stopped';
  }, []);

  // Memoized host click handler to prevent unnecessary re-renders
  const handleHostClick = React.useCallback((host: Host) => {
    addActivity({
      type: 'host_view',
      title: host.name,
      subtitle: 'Host details',
      url: `/hosts/${host.id}`,
      metadata: { hostId: host.id },
    });
    navigate(`/hosts/${host.id}`);
  }, [addActivity, navigate]);

  // Memoized column data renderer for better performance
  const renderColumnData = React.useCallback((host: Host, columnKey: string) => {
    // Check if this is a plugin column
    const column = columns.find(col => col.key === columnKey);
    if (column && column.source === 'plugin' && column.component) {
      // Use runtime type guard to safely validate plugin components
      if (isValidHostTableComponent(column.component)) {
        const PluginComponent = column.component;
        return <PluginComponent host={convertHostForPlugin(host)} />;
      } else {
        console.warn(`Invalid plugin component for column ${columnKey}:`, column.component);
        return <span>Invalid plugin component</span>;
      }
    }

    // Core column rendering
    switch (columnKey) {
      case 'name':
        return (
          <div className="pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-gap-sm">
            <ServerIcon />
            {host.name}
          </div>
        );
      case 'status':
        return (
          <div className="pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-gap-sm">
            {getStatusIcon(host)}
            {getStatusText(host)}
          </div>
        );
      case 'operatingsystem':
        return host.operatingsystem_name || 'Unknown';
      case 'ip':
        return host.ip || 'Not assigned';
      case 'last_report':
        return host.last_report ? formatRelativeTime(host.last_report) : 'Never';
      case 'created_at':
        return formatDateTime(host.created_at);
      case 'environment':
        return host.environment_name || 'Not set';
      case 'hostgroup':
        return host.hostgroup_name || 'Not set';
      case 'owner':
        return host.owner_name || 'Not set';
      case 'location':
        return host.location_name || 'Not set';
      case 'organization':
        return host.organization_name || 'Not set';
      default:
        return 'N/A';
    }
  }, [columns, getStatusIcon, getStatusText]);

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Card>
          <EmptyState>
            <EmptyStateIcon icon={ExclamationTriangleIcon} />
            <Title headingLevel="h4" size="lg">
              Error loading hosts
            </Title>
            <EmptyStateBody>
              {(error as Error)?.message || 'Failed to load hosts'}
            </EmptyStateBody>
          </EmptyState>
        </Card>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          My Hosts
        </Title>
      </PageSection>

      <PageSection>
        <Card>
          <Toolbar id="hosts-toolbar">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  placeholder="Search hosts..."
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>

              <ToolbarItem>
                <Dropdown
                  isOpen={recentDropdownOpen}
                  onOpenChange={setRecentDropdownOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setRecentDropdownOpen(!recentDropdownOpen)}
                      variant="secondary"
                      icon={<HistoryIcon />}
                    >
                      Recent
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem isDisabled>
                      <strong>Recent Hosts</strong>
                    </DropdownItem>
                    <RecentHosts onItemSelect={() => setRecentDropdownOpen(false)} />
                    <Divider />
                    <DropdownItem isDisabled>
                      <strong>Recent Searches</strong>
                    </DropdownItem>
                    <RecentSearches onItemSelect={() => setRecentDropdownOpen(false)} />
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>

              <ToolbarItem>
                <Button
                  variant="secondary"
                  icon={<CogIcon />}
                  onClick={() => setColumnManagerOpen(true)}
                >
                  Manage columns
                </Button>
              </ToolbarItem>

              {canCreateHosts() && (
                <ToolbarItem align={{ default: 'alignRight' }}>
                  <Button
                    variant="primary"
                    icon={<PlusIcon />}
                    onClick={() => navigate('/hosts/new')}
                  >
                    Create Host
                  </Button>
                </ToolbarItem>
              )}
            </ToolbarContent>
          </Toolbar>

          <BulkActionToolbar
            selectedCount={bulkSelection.selectedCount}
            totalCount={total}
            onClearSelection={bulkSelection.clearSelection}
            actions={bulkActions}
            onActionClick={handleBulkActionClick}
          />

          {hosts.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon icon={ServerIcon} />
              <Title headingLevel="h4" size="lg">
                No hosts found
              </Title>
              <EmptyStateBody>
                {search
                  ? 'No hosts match your search criteria.'
                  : 'You don\'t have any hosts yet. Create your first host to get started.'
                }
              </EmptyStateBody>
              {!search && canCreateHosts() && (
                <Button variant="primary" onClick={() => navigate('/hosts/new')}>
                  Create Host
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <Th
                      select={{
                        onSelect: bulkSelection.toggleAll,
                        isSelected: bulkSelection.isAllSelected,
                        isHeaderSelectDisabled: hosts.length === 0,
                      }}
                    />
                    {enabledColumns.map(column => (
                      <Th key={column.key}>
                        {column.label}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {hosts.map((host) => (
                    <Tr
                      key={host.id}
                      isClickable
                      onClick={() => handleHostClick(host)}
                    >
                      <Td
                        select={{
                          onSelect: () => bulkSelection.toggleItem(host.id),
                          isSelected: bulkSelection.isSelected(host.id),
                        }}
                      />
                      {enabledColumns.map(column => (
                        <Td key={column.key}>
                          {renderColumnData(host, column.key)}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {total > perPage && (
                <Toolbar>
                  <ToolbarContent>
                    <ToolbarItem align={{ default: 'alignRight' }}>
                      <Pagination
                        itemCount={total}
                        perPage={perPage}
                        page={page}
                        onSetPage={(_event, pageNumber) => setPage(pageNumber)}
                        onPerPageSelect={(_event, newPerPage) => {
                          setPerPage(newPerPage);
                          setPage(1);
                        }}
                        widgetId="hosts-pagination"
                      />
                    </ToolbarItem>
                  </ToolbarContent>
                </Toolbar>
              )}
            </>
          )}
        </Card>
      </PageSection>

      {/* Column Management Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Manage columns"
        isOpen={columnManagerOpen}
        onClose={() => setColumnManagerOpen(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={() => setColumnManagerOpen(false)}>
            Apply
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setColumnManagerOpen(false)}>
            Cancel
          </Button>,
        ]}
      >
        <Form>
          <FormGroup label="Core columns" fieldId="core-columns">
            {columns.filter(col => col.source === 'core').map(column => (
              <Checkbox
                key={column.key}
                id={`column-${column.key}`}
                label={column.label}
                isChecked={column.enabled}
                isDisabled={column.required}
                onChange={() => toggleColumn(column.key)}
              />
            ))}
          </FormGroup>

          {columns.some(col => col.source === 'plugin') && (
            <FormGroup label="Plugin columns" fieldId="plugin-columns">
              {columns.filter(col => col.source === 'plugin').map(column => (
                <Checkbox
                  key={column.key}
                  id={`column-${column.key}`}
                  label={`${column.label} (${column.plugin || 'Plugin'})`}
                  isChecked={column.enabled}
                  onChange={() => toggleColumn(column.key)}
                />
              ))}
            </FormGroup>
          )}
        </Form>
      </Modal>

      {/* Bulk Action Modal */}
      {bulkActionModal.action && (
        <BulkActionModal
          isOpen={bulkActionModal.isOpen}
          onClose={handleBulkActionModalClose}
          title={bulkActionModal.action.confirmationTitle || bulkActionModal.action.label}
          selectedCount={bulkSelection.selectedCount}
          selectedItems={bulkSelection.selectedObjects.map(host => ({ id: host.id, name: host.name }))}
          onConfirm={handleBulkActionConfirm}
          confirmationMessage={bulkActionModal.action.confirmationMessage}
          requiresConfirmation={bulkActionModal.action.requiresConfirmation}
          destructive={bulkActionModal.action.destructive}
          parameters={
            bulkActionModal.action.id === 'change-hostgroup' ? [
              {
                key: 'hostgroup_id',
                label: 'Host Group',
                type: 'select' as const,
                required: true,
                options: hostGroups?.results?.map(hg => ({
                  value: hg.id,
                  label: hg.title || hg.name,
                })) || [],
                placeholder: 'Select a host group',
              },
            ] : undefined
          }
        />
      )}
    </>
  );
};