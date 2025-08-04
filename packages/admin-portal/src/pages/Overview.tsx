import React from 'react';
import {
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Gallery,
  GalleryItem,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { 
  ServerIcon, 
  UsersIcon, 
  CubesIcon, 
  DatabaseIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@patternfly/react-icons';
import { useSmartProxies, useUsers, useHosts } from '@foreman/shared';

export const Overview: React.FC = () => {
  const { data: smartProxies } = useSmartProxies();
  const { data: users } = useUsers();
  const { data: hosts } = useHosts();

  const stats = [
    {
      title: 'Smart Proxies',
      value: smartProxies?.total || 0,
      icon: <ServerIcon />,
      color: 'blue',
    },
    {
      title: 'Users',
      value: users?.total || 0,
      icon: <UsersIcon />,
      color: 'green',
    },
    {
      title: 'Hosts',
      value: hosts?.total || 0,
      icon: <CubesIcon />,
      color: 'purple',
    },
    {
      title: 'Active Services',
      value: '12',
      icon: <DatabaseIcon />,
      color: 'cyan',
    },
  ];

  const systemHealth = [
    {
      service: 'Foreman Core',
      status: 'healthy',
      message: 'All services running normally',
    },
    {
      service: 'Database',
      status: 'healthy',
      message: 'PostgreSQL connection stable',
    },
    {
      service: 'Smart Proxies',
      status: 'warning',
      message: '1 proxy needs attention',
    },
    {
      service: 'Background Jobs',
      status: 'healthy',
      message: 'All tasks processing normally',
    },
  ];

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          System Overview
        </Title>
        <p>Monitor and manage your Foreman infrastructure</p>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem span={12}>
            <Card>
              <CardTitle>System Statistics</CardTitle>
              <CardBody>
                <Gallery hasGutter minWidths={{ default: '250px' }}>
                  {stats.map((stat) => (
                    <GalleryItem key={stat.title}>
                      <Card isCompact>
                        <CardBody>
                          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                            <FlexItem>
                              <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: `var(--pf-v5-global--palette--${stat.color}-400)` }}>
                                  {stat.value}
                                </div>
                                <div style={{ color: 'var(--pf-v5-global--Color--200)' }}>
                                  {stat.title}
                                </div>
                              </div>
                            </FlexItem>
                            <FlexItem>
                              <div style={{ fontSize: '2rem', color: `var(--pf-v5-global--palette--${stat.color}-400)` }}>
                                {stat.icon}
                              </div>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    </GalleryItem>
                  ))}
                </Gallery>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={12}>
            <Card>
              <CardTitle>System Health</CardTitle>
              <CardBody>
                <Grid hasGutter>
                  {systemHealth.map((item) => (
                    <GridItem key={item.service} span={6}>
                      <Card isCompact>
                        <CardBody>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>
                              {item.status === 'healthy' ? (
                                <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)' }} />
                              ) : (
                                <ExclamationTriangleIcon style={{ color: 'var(--pf-v5-global--warning-color--100)' }} />
                              )}
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <div>
                                <strong>{item.service}</strong>
                                <div style={{ fontSize: '0.875rem', color: 'var(--pf-v5-global--Color--200)' }}>
                                  {item.message}
                                </div>
                              </div>
                            </FlexItem>
                            <FlexItem>
                              <Label 
                                color={item.status === 'healthy' ? 'green' : 'orange'} 
                                variant="filled"
                              >
                                {item.status}
                              </Label>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    </GridItem>
                  ))}
                </Grid>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};