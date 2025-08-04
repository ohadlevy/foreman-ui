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
  useCurrentUserData,
  usePing,
  useStatuses,
  type ForemanStatuses,
  type ForemanStatusItem
} from '@foreman/shared';

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

/**
 * Validates and filters status entries to ensure they are valid objects
 * Filters out null, undefined, arrays, empty objects, and non-objects
 */
const getValidStatusEntries = (statuses: unknown): Array<[string, ForemanStatusItem]> => {
  if (!statuses || typeof statuses !== 'object' || Array.isArray(statuses)) {
    return [];
  }

  return Object.entries(statuses as ForemanStatuses).filter(([_key, statusItem]) =>
    statusItem &&
    typeof statusItem === 'object' &&
    !Array.isArray(statusItem) &&
    Object.keys(statusItem).length > 0
  );
};

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
 * Renders the system status components section with proper error handling
 */
const SystemStatusComponents: React.FC<{
  statuses: unknown,
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

  const validStatusEntries = getValidStatusEntries(statuses);

  if (validStatusEntries.length > 0) {
    return (
      <Grid hasGutter>
        {validStatusEntries.map(([key, statusItem]) => (
          <GridItem key={key} span={6} xl={4}>
            <Card isCompact>
              <CardBody>
                <Flex>
                  <FlexItem>
                    {statusItem?.status === 'ok' ? (
                      <CheckCircleIcon style={{ color: 'var(--pf-global--success-color--100)' }} />
                    ) : statusItem?.status === 'warning' ? (
                      <ExclamationTriangleIcon style={{ color: 'var(--pf-global--warning-color--100)' }} />
                    ) : (
                      <ExclamationTriangleIcon style={{ color: 'var(--pf-global--danger-color--100)' }} />
                    )}
                  </FlexItem>
                  <FlexItem>
                    <div>
                      <Text component={TextVariants.small}>{statusItem?.label || key}</Text>
                      <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
                        {statusItem?.description || key}
                      </Text>
                    </div>
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <Label
                      color={statusItem?.status === 'ok' ? 'green' : statusItem?.status === 'warning' ? 'orange' : 'red'}
                      isCompact
                    >
                      {(statusItem?.status?.trim() || '').toUpperCase() || 'UNKNOWN'}
                    </Label>
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <InfoIcon style={{ color: 'var(--pf-global--info-color--100)', marginRight: '0.5rem' }} />
      <Text>No system status information available</Text>
      <Text component={TextVariants.small} style={{ color: 'var(--pf-global--Color--200)' }}>
        The Foreman API did not return any status components to monitor.
      </Text>
    </div>
  );
};

export const SystemStatus: React.FC = () => {
  const plugins = usePlugins();
  const loadState = usePluginLoadState();
  const dashboardWidgets = usePluginDashboardWidgets();
  const menuItems = usePluginMenuItems();
  const { data: currentUser } = useCurrentUserData();
  const { data: ping, isLoading: pingLoading, error: pingError } = usePing();
  const { data: statuses, isLoading: statusesLoading, error: statusesError } = useStatuses();


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

    return {
      dashboardWidgets: plugin.dashboardWidgets?.length || 0,
      menuItems: plugin.menuItems?.length || 0,
      routes: plugin.routes?.length || 0,
      extensions: 0,
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
                        <Text component={TextVariants.small}>
                          {pingLoading ? 'Loading...' : pingError ? 'Unknown' : ping?.version || 'Unknown'}
                        </Text>
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
                        <Text component={TextVariants.small}>Additional Menu Items</Text>
                        <Title headingLevel="h3" size="2xl">
                          {menuItems.length}
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
                              {(features.extensions || 0) > 0 && (
                                <ListItem>
                                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                  {features.extensions} Extension Point{(features.extensions || 0) !== 1 ? 's' : ''}
                                </ListItem>
                              )}
                              {Object.values(features).every(v => v === 0) && (
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