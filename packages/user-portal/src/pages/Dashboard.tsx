import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Gallery,
  GalleryItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import { useMyHosts, useCurrentUserData, usePermissions, DashboardWidgets } from '@foreman/shared';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { data: hostsData, isLoading: hostsLoading } = useMyHosts();
  const { data: user } = useCurrentUserData();
  const { canCreateHosts, canViewHosts } = usePermissions();
  const navigate = useNavigate();

  const totalHosts = hostsData?.total || 0;
  const runningHosts = hostsData?.results?.filter(host => host.enabled)?.length || 0;
  const buildingHosts = hostsData?.results?.filter(host => host.build)?.length || 0;

  // Check user permissions to determine available actions

  // Build available quick actions based on permissions
  const quickActions = [];

  if (canCreateHosts()) {
    quickActions.push({
      title: 'Create New Host',
      description: 'Provision a new host from available templates',
      onClick: () => navigate('/hosts/new'),
    });
  }

  if (canViewHosts()) {
    quickActions.push({
      title: 'Manage Hosts',
      description: 'View and manage your existing hosts',
      onClick: () => navigate('/hosts'),
    });
  }

  // Profile is always available
  quickActions.push({
    title: 'Update Profile',
    description: 'Manage your account settings and preferences',
    onClick: () => navigate('/profile'),
  });

  const statsCards = [
    {
      title: 'Total Hosts',
      value: totalHosts,
      icon: ServerIcon,
      description: 'Hosts you own',
    },
    {
      title: 'Running Hosts',
      value: runningHosts,
      icon: CheckCircleIcon,
      description: 'Currently enabled',
    },
    {
      title: 'Building Hosts',
      value: buildingHosts,
      icon: ExclamationTriangleIcon,
      description: 'In build mode',
    },
  ];

  return (
    <>
      <PageSection variant="light">
        <TextContent>
          <Title headingLevel="h1" size="2xl">
            Welcome{user?.firstname ? `, ${user.firstname}` : ''}!
          </Title>
          <Text component={TextVariants.p}>
            Manage your infrastructure and monitor your hosts from this dashboard.
          </Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <Gallery hasGutter minWidths={{ default: '300px' }}>
          {statsCards.map((stat, index) => (
            <GalleryItem key={index}>
              <Card isClickable>
                <CardTitle>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <stat.icon />
                    {stat.title}
                  </div>
                </CardTitle>
                <CardBody>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    {hostsLoading ? '...' : stat.value}
                  </div>
                  <Text component={TextVariants.small}>
                    {stat.description}
                  </Text>
                </CardBody>
              </Card>
            </GalleryItem>
          ))}
        </Gallery>
      </PageSection>

      {quickActions.length > 0 && (
        <PageSection>
          <Card>
            <CardTitle>Quick Actions</CardTitle>
            <CardBody>
              <Gallery hasGutter>
                {quickActions.map((action, index) => (
                  <GalleryItem key={index}>
                    <Card isClickable onClick={action.onClick}>
                      <CardBody>
                        <Title headingLevel="h3" size="lg">
                          {action.title}
                        </Title>
                        <Text>
                          {action.description}
                        </Text>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                ))}
              </Gallery>
            </CardBody>
          </Card>
        </PageSection>
      )}

      {/* Plugin Dashboard Widgets */}
      <PageSection>
        <DashboardWidgets />
      </PageSection>
    </>
  );
};