import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  Button,
  SearchInput,
  Pagination,
  EmptyState,
  EmptyStateBody,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Divider,
  Modal,
  ModalVariant,
  ModalBody,
  ModalFooter,
  Checkbox,
  Form,
  FormGroup,
  Card,
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
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  useHosts,
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
  BulkActionsProvider,
  BulkActionsContainer,
} from '@foreman/shared';
import { Host } from '@foreman/shared';

// Layout constants removed - using CSS-based spacing instead

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
  const { canCreateHosts, canEditHosts, canDeleteHosts, canBuildHosts } = usePermissions();
  const { addActivity } = useActivityStore();
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);

  // Data fetching - moved to top for better readability
  const { data, isLoading, error, refetch } = useHosts({
    search,
    page,
    per_page: perPage,
  });

  // Track plugin registry changes to update columns when plugins are loaded/unloaded
  const [pluginRegistryVersion, setPluginRegistryVersion] = React.useState(0);
  
  React.useEffect(() => {
    const unsubscribe = pluginRegistry.subscribe(() => {
      setPluginRegistryVersion(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

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
      title: 'Hosts',
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

  // Get hosts data early for hooks
  const hosts = (data?.results || []) as Host[];
  const total = data?.total || 0;

  // Fetch all host IDs for select all pages functionality (only when needed)
  // TODO: Implement "select all pages" functionality 
  // Best approaches: GraphQL query to fetch all IDs OR use search API with just ID fields
  // For now, disabled until GraphQL implementation

  // Bulk selection management - must be called before any early returns
  const {
    selectedObjects,
    selectedCount,
    isSelected,
    isAllCurrentPageSelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectAllPages,
  } = useBulkSelection({
    items: hosts,
    totalCount: total,
    onSelectAllPages: async () => {
      // TODO: Implement proper "select all pages" with GraphQL or search API
      // For now, fallback to current page only
      console.warn('Select all pages not yet implemented with new context system. Selecting current page only.');
      return hosts.map(host => host.id);
    },
  });

  // Convert selected hosts to the format expected by BulkActionsContainer
  const selectedItems = selectedObjects.map(host => ({
    id: host.id,
    name: host.name,
  }));

  // Build user permissions array based on actual permissions
  const userPermissions = [
    { key: 'edit_hosts', check: canEditHosts },
    { key: 'build_hosts', check: canBuildHosts },
    { key: 'destroy_hosts', check: canDeleteHosts }
  ].filter(perm => perm.check()).map(perm => perm.key);

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
          <div className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-gap-sm">
            <ServerIcon />
            {host.name}
          </div>
        );
      case 'status':
        return (
          <div className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-gap-sm">
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
          <EmptyState
            titleText="Error loading hosts"
            icon={ExclamationTriangleIcon}
            variant="lg"
          >
            <EmptyStateBody>
              {(error as Error)?.message || 'Failed to load hosts'}
            </EmptyStateBody>
          </EmptyState>
        </Card>
      </PageSection>
    );
  }

  return (
    <BulkActionsProvider
      enabledActions={[
        'update_hostgroup',
        'update_owner',
        'update_organization',
        'update_location',
        'build',
        'destroy',
        'disown'
      ]}
      userPermissions={userPermissions}
      hasSelectedItems={selectedCount > 0}
    >
      <PageSection variant="secondary">
        <Title headingLevel="h1" size="2xl">
          Hosts
        </Title>
      </PageSection>

      <PageSection>
        <Toolbar id="hosts-toolbar">
            <ToolbarContent>
              {/* Left group - Search and filters */}
              <ToolbarGroup>
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
              </ToolbarGroup>

              {/* Right group - Actions */}
              <ToolbarGroup align={{ default: 'alignEnd' }}>
                {canCreateHosts() && (
                  <ToolbarItem>
                    <Button
                      variant="primary"
                      icon={<PlusIcon />}
                      onClick={() => navigate('/hosts/new')}
                    >
                      Create Host
                    </Button>
                  </ToolbarItem>
                )}
              </ToolbarGroup>
            </ToolbarContent>

            {/* Bulk Actions - Show in separate toolbar row when active */}
            {hosts.length > 0 && selectedCount > 0 && (
              <ToolbarContent>
                <ToolbarItem>
                  <BulkActionsContainer
                    selectedItems={selectedItems}
                    totalCount={total}
                    onClearSelection={clearSelection}
                    onSelectAllPages={selectAllPages}
                    showSelectAllPages={selectedCount > 0 && selectedCount < total}
                    onSuccess={refetch}
                  />
                </ToolbarItem>
              </ToolbarContent>
            )}
          </Toolbar>


          {hosts.length === 0 ? (
            <EmptyState
              titleText="No hosts found"
              icon={ServerIcon}
              variant="lg"
            >
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
                        onSelect: (event) => {
                          event.stopPropagation();
                          toggleAll();
                        },
                        isSelected: isAllCurrentPageSelected,
                        isHeaderSelectDisabled: hosts.length === 0,
                      }}
                      screenReaderText="Select all hosts"
                    />
                    {enabledColumns.map(column => (
                      <Th key={column.key}>
                        {column.label}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {hosts.map((host, index) => (
                    <Tr key={host.id}>
                      <Td
                        select={{
                          onSelect: (event) => {
                            event.stopPropagation();
                            toggleItem(host.id);
                          },
                          isSelected: isSelected(host.id),
                          rowIndex: index,
                        }}
                      />
                      {enabledColumns.map(column => (
                        <Td
                          key={column.key}
                          isActionCell={false}
                          onClick={() => handleHostClick(host)}
                          style={{ cursor: 'pointer' }}
                        >
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
                    <ToolbarItem align={{ default: 'alignEnd' }}>
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
      </PageSection>

      {/* Column Management Modal */}
      <Modal
        variant={ModalVariant.medium}
        title="Manage columns"
        isOpen={columnManagerOpen}
        onClose={() => setColumnManagerOpen(false)}
      >
        <ModalBody>
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
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={() => setColumnManagerOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setColumnManagerOpen(false)}>
            Apply
          </Button>
        </ModalFooter>
      </Modal>
    </BulkActionsProvider>
  );
};