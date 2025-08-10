import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Grid,
  GridItem,
  List,
  ListItem,
  Text,
  TextContent,
  TextVariants,
  Label,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateHeader,
  ExpandableSection,
  Progress,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InfoIcon,
  CubesIcon,
  NetworkIcon,
  DatabaseIcon,
  ClockIcon,
} from '@patternfly/react-icons';
import {
  usePlugins,
  usePluginLoadState,
  usePluginDashboardWidgets,
  usePluginMenuItems,
  useAuth,
  useStatuses,
  pluginRegistry,
  EXTENSION_POINTS,
  type ForemanStatusesResponse,
  type CacheStatus,
  type ApiStatusData
} from '@foreman/shared';

// Status constants
const STATUS = {
  OK: 'ok',
  ERROR: 'error'
} as const;

// Health calculation constants
// Weight distribution reflects impact on user experience:
// - PLUGINS (60%): Most variable component, directly affects available functionality
// - API (30%): Core connectivity, affects all operations but usually stable
// - AUTH (10%): Binary state (authenticated or not), least variable in normal operation
const HEALTH_WEIGHTS = {
  PLUGINS: 0.6, // Plugins are the main differentiator and most likely to have issues
  API: 0.3,     // API connectivity is critical but typically more stable
  AUTH: 0.1,    // Authentication is binary - either working or user can't see this page
} as const;


const HEALTH_THRESHOLDS = {
  HEALTHY: 90,
  WARNING: 70,
} as const;

const DEFAULT_HEALTH_VALUES = {
  API_WITH_USER: 100,
  API_WITHOUT_USER: 85,
  AUTH_AUTHENTICATED: 100,
} as const;

/**
 * Determines cache system status based on cache server data
 */
const getCacheStatus = (cacheData?: CacheStatus) => {
  if (!Array.isArray(cacheData?.servers) || cacheData.servers.length === 0) {
    return STATUS.ERROR;
  }
  return cacheData.servers.every(s => s.status === STATUS.OK) ? STATUS.OK : STATUS.ERROR;
};

/**
 * Calculates comprehensive duration information for cache servers
 * Returns formatted duration string or undefined if no valid durations
 */
const getCacheDuration = (cacheData?: CacheStatus): number | undefined => {
  if (!Array.isArray(cacheData?.servers) || cacheData.servers.length === 0) {
    return undefined;
  }

  const validDurations = cacheData.servers
    .map(s => s.duration_ms)
    .filter((duration): duration is number => typeof duration === 'number');

  if (validDurations.length === 0) {
    return undefined;
  }

  if (validDurations.length === 1) {
    return validDurations[0];
  }

  // For multiple servers, return the average duration
  const averageDuration = validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length;
  return Math.round(averageDuration);
};

/**
 * Determines API service status based on API data
 * Provides granular logic based on available information
 */
const getApiStatus = (apiData?: ApiStatusData) => {
  // If explicit status is provided, use it (only OK status is considered successful)
  if (apiData?.status) {
    return apiData.status === STATUS.OK ? STATUS.OK : STATUS.ERROR;
  }

  // Without explicit status, check version availability as indicator of basic API functionality
  // Robust version validation - exclude invalid/placeholder values
  if (isValidVersion(apiData?.version)) {
    return STATUS.OK;
  }

  // No status and no valid version indicates API is not accessible
  return STATUS.ERROR;
};

/**
 * Validates if a version string represents a real API version
 * Excludes common placeholder/invalid values
 */
const isValidVersion = (version?: string): boolean => {
  if (!version || typeof version !== 'string') {
    return false;
  }

  const trimmedVersion = version.trim().toLowerCase();

  // Empty or whitespace-only strings
  if (trimmedVersion.length === 0) {
    return false;
  }

  // Common invalid/placeholder values
  const invalidValues = ['unknown', 'n/a', 'na', 'null', 'undefined', 'error', 'unavailable'];
  if (invalidValues.includes(trimmedVersion)) {
    return false;
  }

  // Version should contain at least one digit or semantic version pattern
  return /\d/.test(trimmedVersion);
};

/**
 * Renders the system status components section with proper error handling
 */
const SystemStatusComponents: React.FC<{
  statuses: ForemanStatusesResponse | undefined,
  statusesLoading: boolean,
  statusesError: Error | null
}> = ({
  statuses,
  statusesLoading,
  statusesError
}) => {
  if (statusesLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Text>Loading system statuses...</Text>
      </div>
    );
  }

  if (statusesError) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <ExclamationTriangleIcon style={{ color: 'var(--pf-global--warning-color--100)', marginRight: '0.5rem' }} />
        <Text>Unable to fetch system statuses</Text>
        <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
          This may indicate the Foreman API is not accessible or the /api/statuses endpoint is not available.
        </Text>
      </div>
    );
  }

  const foremanData = statuses?.results?.foreman;
  if (!foremanData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <InfoIcon style={{ color: 'var(--pf-global--info-color--100)', marginRight: '0.5rem' }} />
        <Text>No system status information available</Text>
        <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
          The Foreman API did not return any status components to monitor.
        </Text>
      </div>
    );
  }

  // Calculate cache duration for display
  const cacheDuration = getCacheDuration(foremanData.cache);

  const systemComponents = [
    {
      key: 'database',
      label: 'Database',
      description: 'Database connectivity and performance',
      status: foremanData.database?.active ? STATUS.OK : STATUS.ERROR,
      duration: foremanData.database?.duration_ms,
      icon: <DatabaseIcon />
    },
    {
      key: 'cache',
      label: 'Cache System',
      description: 'Cache servers status and performance',
      status: getCacheStatus(foremanData.cache),
      duration: cacheDuration,
      icon: <NetworkIcon />
    },
    {
      key: 'api',
      label: 'API Service',
      description: `REST API version ${foremanData.api?.version}`,
      status: getApiStatus(foremanData.api),
      icon: <ClockIcon />
    }
  ];

  return (
    <Grid hasGutter>
      {systemComponents.map((component) => (
        <GridItem key={component.key} span={6} xl={4}>
          <Card isCompact>
            <CardBody>
              <Flex>
                <FlexItem>
                  <div style={{ marginRight: '0.5rem', color: 'var(--pf-global--Color--200)' }}>
                    {component.icon}
                  </div>
                </FlexItem>
                <FlexItem>
                  <div>
                    <Text component={TextVariants.small}>{component.label}</Text>
                    <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
                      {component.description}
                      {component.duration && ` (${component.duration}ms)`}
                    </Text>
                  </div>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {component.status === STATUS.OK ? (
                      <CheckCircleIcon style={{ color: 'var(--pf-global--success-color--100)' }} />
                    ) : (
                      <ExclamationTriangleIcon style={{ color: 'var(--pf-global--danger-color--100)' }} />
                    )}
                    <Label
                      color={component.status === STATUS.OK ? 'green' : 'red'}
                      isCompact
                    >
                      {component.status.toUpperCase()}
                    </Label>
                  </div>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </GridItem>
      ))}
    </Grid>
  );
};

export const SystemStatus: React.FC = () => {
  const plugins = usePlugins();
  const loadState = usePluginLoadState();
  const dashboardWidgets = usePluginDashboardWidgets();
  const menuItems = usePluginMenuItems();
  const { user: currentUser } = useAuth();
  const { data: statuses, isLoading: statusesLoading, error: statusesError } = useStatuses();

  // Calculate total bulk actions provided by plugins
  const totalBulkActions = React.useMemo(() => {
    return pluginRegistry.getPluginsWithExtensions(EXTENSION_POINTS.HOST_BULK_ACTIONS).length;
  }, [plugins]);


  // System health metrics based only on what we can observe
  const systemHealth = React.useMemo(() => {
    const totalPlugins = plugins.length;
    const workingPlugins = loadState.loaded.length;

    // Plugin system health (100% if no plugins, or percentage working)
    const pluginHealth = totalPlugins > 0 ? (workingPlugins / totalPlugins) * 100 : 100;

    // API health - if we can fetch detailed user data, API is working well
    const apiHealth = currentUser ? DEFAULT_HEALTH_VALUES.API_WITH_USER : DEFAULT_HEALTH_VALUES.API_WITHOUT_USER;

    // Since user can only see this page when authenticated, auth is always healthy
    const authHealth = DEFAULT_HEALTH_VALUES.AUTH_AUTHENTICATED;

    // Overall calculation - weight plugins more heavily since that's what varies
    const overallHealth = Math.round(
      (pluginHealth * HEALTH_WEIGHTS.PLUGINS) +
      (apiHealth * HEALTH_WEIGHTS.API) +
      (authHealth * HEALTH_WEIGHTS.AUTH)
    );

    return {
      overall: overallHealth,
      api: apiHealth,
      auth: authHealth,
      plugins: pluginHealth,
      status: overallHealth >= HEALTH_THRESHOLDS.HEALTHY
        ? 'healthy'
        : overallHealth >= HEALTH_THRESHOLDS.WARNING
          ? 'warning'
          : 'critical'
    };
  }, [plugins.length, loadState.loaded.length, currentUser]);

  const getHealthColor = (percentage: number): 'success' | 'warning' | 'danger' => {
    if (percentage >= HEALTH_THRESHOLDS.HEALTHY) return 'success';
    if (percentage >= HEALTH_THRESHOLDS.WARNING) return 'warning';
    return 'danger';
  };

  const getHealthIcon = (percentage: number) => {
    if (percentage >= HEALTH_THRESHOLDS.HEALTHY) return <CheckCircleIcon color="var(--pf-global--success-color--100)" />;
    if (percentage >= HEALTH_THRESHOLDS.WARNING) return <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />;
    return <ExclamationTriangleIcon color="var(--pf-global--danger-color--100)" />;
  };

  const getStatusIcon = (pluginName: string) => {
    if (loadState.failed.some(f => f.name === pluginName)) {
      return <ExclamationTriangleIcon color="var(--pf-global--danger-color--100)" />;
    }
    if (loadState.loaded.includes(pluginName)) {
      return <CheckCircleIcon color="var(--pf-global--success-color--100)" />;
    }
    return <InfoIcon color="var(--pf-global--info-color--100)" />;
  };

  const getStatusLabel = (pluginName: string) => {
    if (loadState.failed.some(f => f.name === pluginName)) {
      return <Label color="red">Failed</Label>;
    }
    if (loadState.loaded.includes(pluginName)) {
      return <Label color="green">Active</Label>;
    }
    return <Label color="blue">Loading</Label>;
  };

  const getPluginError = (pluginName: string) => {
    const failed = loadState.failed.find(f => f.name === pluginName);
    return failed?.error?.message;
  };

  const getPluginFeatures = (pluginName: string) => {
    const plugin = plugins.find(p => p.name === pluginName);
    if (!plugin) return {};

    // Count extensions by type for more detailed display
    const extensionsByType: Record<string, number> = {};
    let bulkActionsCount = 0;

    plugin.componentExtensions?.forEach(ext => {
      const extensionType = ext.extensionPoint;
      extensionsByType[extensionType] = (extensionsByType[extensionType] || 0) + 1;

      // Count bulk actions specifically
      if (extensionType === EXTENSION_POINTS.HOST_BULK_ACTIONS) {
        bulkActionsCount++;
      }
    });

    return {
      dashboardWidgets: plugin.dashboardWidgets?.length || 0,
      menuItems: plugin.menuItems?.length || 0,
      routes: plugin.routes?.length || 0,
      extensions: plugin.componentExtensions?.length || 0,
      bulkActions: bulkActionsCount,
      extensionsByType,
    };
  };

  if (plugins.length === 0) {
    return (
      <PageSection>
        <EmptyState>
          <EmptyStateHeader
            titleText="No additional extensions found"
            headingLevel="h1"
            icon={<EmptyStateIcon icon={CubesIcon} />}
          />
          <EmptyStateBody>
            Your Foreman installation is running with the core features only.
            Extensions (also called plugins) can be installed by your system administrator
            to add additional functionality like monitoring tools, reporting features,
            or integration with other systems.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <TextContent>
          <Title headingLevel="h1" size="2xl">
            System Status
          </Title>
          <Text component={TextVariants.p}>
            Overview of your Foreman system health, including core services and installed extensions.
            This page helps you understand what features are available and if everything is working properly.
          </Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          {/* Overall System Health */}
          <GridItem span={12}>
            <Card>
              <CardTitle>
                <Flex>
                  <FlexItem>{getHealthIcon(systemHealth.overall)}</FlexItem>
                  <FlexItem>
                    <Title headingLevel="h2" size="lg">Overall System Health</Title>
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <Label color={getHealthColor(systemHealth.overall) === 'success' ? 'green' : getHealthColor(systemHealth.overall) === 'warning' ? 'orange' : 'red'}>
                      {systemHealth.status.toUpperCase()} - {systemHealth.overall}%
                    </Label>
                  </FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>
                <Grid hasGutter>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <DatabaseIcon style={{ marginRight: '0.5rem' }} />
                          <Text component={TextVariants.small}>API Connection</Text>
                        </div>
                        <Progress
                          value={systemHealth.api}
                          measureLocation={ProgressMeasureLocation.outside}
                          variant={getHealthColor(systemHealth.api)}
                          aria-label={`API Connection health: ${systemHealth.api}%`}
                        />
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <NetworkIcon style={{ marginRight: '0.5rem' }} />
                          <Text component={TextVariants.small}>Authentication</Text>
                        </div>
                        <Progress
                          value={systemHealth.auth}
                          measureLocation={ProgressMeasureLocation.outside}
                          variant={getHealthColor(systemHealth.auth)}
                          aria-label={`Authentication health: ${systemHealth.auth}%`}
                        />
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <CubesIcon style={{ marginRight: '0.5rem' }} />
                          <Text component={TextVariants.small}>Extensions</Text>
                        </div>
                        <Progress
                          value={systemHealth.plugins}
                          measureLocation={ProgressMeasureLocation.outside}
                          variant={getHealthColor(systemHealth.plugins)}
                          aria-label={`Extensions health: ${systemHealth.plugins}%`}
                        />
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <ClockIcon style={{ marginRight: '0.5rem' }} />
                          <Text component={TextVariants.small}>Foreman Version</Text>
                        </div>
                        <div style={{ minHeight: '24px', display: 'flex', alignItems: 'center' }}>
                          <Text component={TextVariants.small} style={{ fontWeight: 'bold' }}>
                            {statusesLoading ? 'Loading...' : statusesError ? 'Unknown' : statuses?.results?.foreman?.version || 'Unknown'}
                          </Text>
                        </div>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          </GridItem>

          {/* Quick Stats */}
          <GridItem span={12}>
            <Card>
              <CardTitle>Quick Statistics</CardTitle>
              <CardBody>
                <Grid hasGutter>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <Text component={TextVariants.small}>Installed Extensions</Text>
                        <Title headingLevel="h3" size="2xl">
                          {plugins.length}
                        </Title>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <Text component={TextVariants.small}>Working Extensions</Text>
                        <Title headingLevel="h3" size="2xl" style={{ color: 'var(--pf-global--success-color--100)' }}>
                          {loadState.loaded.length}
                        </Title>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <Text component={TextVariants.small}>Extra Dashboard Items</Text>
                        <Title headingLevel="h3" size="2xl">
                          {dashboardWidgets.length}
                        </Title>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={3}>
                    <Card isCompact>
                      <CardBody>
                        <Text component={TextVariants.small}>Plugin Bulk Actions</Text>
                        <Title headingLevel="h3" size="2xl">
                          {totalBulkActions}
                        </Title>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
                <Grid hasGutter style={{ marginTop: '1rem' }}>
                  <GridItem span={6}>
                    <Card isCompact>
                      <CardBody>
                        <Text component={TextVariants.small}>Additional Menu Items</Text>
                        <Title headingLevel="h3" size="2xl">
                          {menuItems.length}
                        </Title>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem span={6}>
                    <Card isCompact>
                      <CardBody>
                        <Text component={TextVariants.small}>Total Extensions</Text>
                        <Title headingLevel="h3" size="2xl">
                          {plugins.reduce((total, plugin) => total + (plugin.componentExtensions?.length || 0), 0)}
                        </Title>
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          </GridItem>


          {/* Extensions Details */}
          {plugins.length > 0 && (
            <GridItem span={12}>
              <Card>
                <CardTitle>Installed Extensions</CardTitle>
                <CardBody>
                  <TextContent style={{ marginBottom: '1rem' }}>
                    <Text component={TextVariants.p}>
                      Your Foreman installation includes additional features called extensions or plugins.
                      These add extra functionality like new dashboard widgets, menu items, and specialized tools.
                    </Text>
                  </TextContent>
                  <ExpandableSection
                    toggleText={`Show ${plugins.length} extension${plugins.length !== 1 ? 's' : ''}`}
                    isIndented
                  >
                    <Grid hasGutter>

          {plugins.map((plugin) => {
            const features = getPluginFeatures(plugin.name);
            const error = getPluginError(plugin.name);

            return (
              <GridItem key={plugin.name} span={12}>
                <Card>
                  <CardTitle>
                    <Flex>
                      <FlexItem>{getStatusIcon(plugin.name)}</FlexItem>
                      <FlexItem>
                        <Title headingLevel="h3" size="lg">
                          {plugin.displayName}
                        </Title>
                      </FlexItem>
                      <FlexItem align={{ default: 'alignRight' }}>
                        {getStatusLabel(plugin.name)}
                      </FlexItem>
                    </Flex>
                  </CardTitle>
                  <CardBody>
                    <Grid hasGutter>
                      <GridItem span={8}>
                        <TextContent>
                          <Text component={TextVariants.p}>
                            {plugin.description}
                          </Text>
                          <Text component={TextVariants.small}>
                            <strong>Version:</strong> {plugin.version} |
                            <strong> Author:</strong> {plugin.author} |
                            <strong> Plugin Name:</strong> {plugin.name}
                          </Text>
                          {plugin.foremanVersions && (
                            <Text component={TextVariants.small}>
                              <strong>Compatible with Foreman:</strong> {plugin.foremanVersions.join(', ')}
                            </Text>
                          )}
                        </TextContent>

                        {error && (
                          <div style={{ marginTop: '1rem' }}>
                            <Label color="red" icon={<ExclamationTriangleIcon />}>
                              Error: {error}
                            </Label>
                          </div>
                        )}
                      </GridItem>

                      <GridItem span={4}>
                        <Card isCompact>
                          <CardTitle>Features Provided</CardTitle>
                          <CardBody>
                            <List isPlain>
                              {(features.dashboardWidgets || 0) > 0 && (
                                <ListItem>
                                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                  {features.dashboardWidgets} Dashboard Widget{(features.dashboardWidgets || 0) !== 1 ? 's' : ''}
                                </ListItem>
                              )}
                              {(features.menuItems || 0) > 0 && (
                                <ListItem>
                                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                  {features.menuItems} Menu Item{(features.menuItems || 0) !== 1 ? 's' : ''}
                                </ListItem>
                              )}
                              {(features.routes || 0) > 0 && (
                                <ListItem>
                                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                  {features.routes} Route{(features.routes || 0) !== 1 ? 's' : ''}
                                </ListItem>
                              )}
                              {(features.bulkActions || 0) > 0 && (
                                <ListItem>
                                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                  {features.bulkActions} Bulk Action{(features.bulkActions || 0) !== 1 ? 's' : ''}
                                </ListItem>
                              )}
                              {features.extensionsByType && Object.entries(features.extensionsByType).map(([extensionType, count]) => {
                                // Convert extension point names to user-friendly labels
                                const getExtensionLabel = (type: string) => {
                                  switch (type) {
                                    case 'host-table-columns':
                                      return 'Host Table Column';
                                    case 'host-details-tabs':
                                      return 'Host Details Tab';
                                    case 'host-bulk-actions':
                                      return 'Host Bulk Action';
                                    case 'dashboard-widgets':
                                      return 'Dashboard Widget Extension';
                                    default:
                                      return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                  }
                                };

                                return (
                                  <ListItem key={extensionType}>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                    {count} {getExtensionLabel(extensionType)}{count !== 1 ? 's' : ''}
                                  </ListItem>
                                );
                              })}
                              {Object.values(features).filter(v => typeof v === 'number').every(v => v === 0) && (
                                <ListItem>
                                  <InfoIcon color="var(--pf-global--info-color--100)" />{' '}
                                  No features detected
                                </ListItem>
                              )}
                            </List>
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
              </GridItem>
            );
          })}
                    </Grid>
                  </ExpandableSection>
                </CardBody>
              </Card>
            </GridItem>
          )}

          {/* Foreman System Statuses */}
          <GridItem span={12}>
            <Card>
              <CardTitle>System Components Status</CardTitle>
              <CardBody>
                <SystemStatusComponents
                  statuses={statuses}
                  statusesLoading={statusesLoading}
                  statusesError={statusesError}
                />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};