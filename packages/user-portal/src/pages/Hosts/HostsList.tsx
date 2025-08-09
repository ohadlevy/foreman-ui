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
} from '@foreman/shared';
import { Host } from '@foreman/shared';

export const HostsList: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateHosts } = usePermissions();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);

  const { addActivity } = useActivityStore();

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

  // Base columns configuration
  const baseColumns: ColumnConfig[] = [
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

  // Memoized plugin columns to avoid expensive calls on every render
  // Note: pluginRegistry and EXTENSION_POINTS.HOST_TABLE_COLUMNS are static objects,
  // so we use an empty dependency array for optimal performance
  const pluginColumns = React.useMemo(() => {
    const extensions = pluginRegistry.getPluginsWithExtensions(EXTENSION_POINTS.HOST_TABLE_COLUMNS);
    return extensions.map((ext, index) => {
      const { key: propKey, label: propLabel, ...otherProps } = ext.props || {};
      return {
        key: propKey || 
             (ext.component?.name ? `${ext.component.name.toLowerCase()}_column` : `plugin_column_${index}`),
        label: ext.title || propLabel || 'Plugin Column',
        enabled: false,
        required: false,
        source: 'plugin' as const,
        plugin: ext.component?.name || 'plugin',
        component: ext.component,
        ...otherProps
      } as ColumnConfig;
    });
  }, []); // Empty array - static objects don't change during component lifecycle

  // Combine base and plugin columns - memoized to prevent unnecessary recalculations
  const allAvailableColumns = React.useMemo(() => {
    return [...baseColumns, ...pluginColumns];
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
      console.warn('Failed to load column preferences:', error);
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
      console.warn('Failed to save column preferences:', error);
    }
  }, []); // No dependencies - localStorage operations are always safe

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

  // Helper function to convert Host to HostTableColumnProps['host']
  const convertHostForPlugin = React.useCallback((host: Host): HostTableColumnProps['host'] => {
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
  }, []);

  const { data, isLoading, error } = useMyHosts({
    search,
    page,
    per_page: perPage,
  });

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

  const getStatusIcon = (host: Host) => {
    if (host.build) {
      return <ExclamationTriangleIcon color="orange" />;
    }
    if (host.enabled) {
      return <CheckCircleIcon color="green" />;
    }
    return <TimesCircleIcon color="red" />;
  };

  const getStatusText = (host: Host) => {
    if (host.build) return 'Building';
    if (host.enabled) return 'Running';
    return 'Stopped';
  };

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

  const hosts = data?.results || [];
  const total = data?.total || 0;

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
    </>
  );

  // Helper function to render column data
  function renderColumnData(host: Host, columnKey: string) {
    // Check if this is a plugin column
    const column = columns.find(col => col.key === columnKey);
    if (column && column.source === 'plugin' && column.component) {
      // Render plugin component with proper type conversion
      // Since we know this is a host table column component, we can safely cast
      const PluginComponent = column.component as React.ComponentType<HostTableColumnProps>;
      return <PluginComponent host={convertHostForPlugin(host)} />;
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
  }
};