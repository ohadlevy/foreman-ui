import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Gallery,
  GalleryItem,
  Content,
  ContentVariants,
  Button,
} from '@patternfly/react-core';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import { useHosts, usePermissions, useAuth } from '@foreman/shared';
import { useNavigate } from 'react-router-dom';
import { DraggableDashboard } from '../components';

export const Dashboard: React.FC = () => {
  const { data: hostsData, isLoading: hostsLoading } = useHosts();
  const { user } = useAuth();
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
    <div data-testid="dashboard-page">
      <PageSection variant="secondary">
        <Content>
          <Title headingLevel="h1" size="2xl">
            Welcome{user?.firstname ? `, ${user.firstname}` : ''}!
          </Title>
          <Content component={ContentVariants.p}>
            Manage your infrastructure and monitor your hosts from this dashboard.
          </Content>
        </Content>
      </PageSection>

      <PageSection>
        <Gallery hasGutter minWidths={{ default: '300px' }}>
          {statsCards.map((stat) => (
            <GalleryItem key={stat.title}>
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
                  <Content component={ContentVariants.small}>
                    {stat.description}
                  </Content>
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
                {quickActions.map((action) => (
                  <GalleryItem key={action.title}>
                    <Card>
                      <CardBody style={{ textAlign: 'center', padding: '2rem' }}>
                        <Button 
                          variant="primary" 
                          size="lg"
                          onClick={action.onClick}
                          style={{ marginBottom: '1rem', minWidth: '200px' }}
                        >
                          {action.title}
                        </Button>
                        <Content style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.9rem' }}>
                          {action.description}
                        </Content>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                ))}
              </Gallery>
            </CardBody>
          </Card>
        </PageSection>
      )}

      {/* Plugin Dashboard Widgets - Draggable */}
      <PageSection>
        <DraggableDashboard />
      </PageSection>
    </div>
  );
};