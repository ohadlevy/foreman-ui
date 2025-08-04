import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Grid,
  GridItem,
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  Button,
  Spinner,
} from '@patternfly/react-core';
import { 
  CogIcon, 
  UsersIcon, 
  ServerIcon, 
  GlobeIcon,
  PlusCircleIcon 
} from '@patternfly/react-icons';
import { 
  useCurrentUser, 
  useSmartProxies, 
  useUsers,
  SmartProxiesTable,
  UsersTable,
  SmartProxyForm,
  UserForm,
  useCreateSmartProxy,
  useCreateUser,
  SmartProxyFormData,
  UserFormData
} from '@foreman/shared';

export const Settings: React.FC = () => {
  const [activeTabKey, setActiveTabKey] = useState<string | number>('profile');
  const [showSmartProxyForm, setShowSmartProxyForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  // Fetch current user to check permissions
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  
  // Fetch admin data (only if user is admin)
  const { data: smartProxies, isLoading: proxiesLoading } = useSmartProxies();
  
  const { data: users, isLoading: usersLoading } = useUsers();

  // Mutations for creating resources
  const createSmartProxy = useCreateSmartProxy();
  const createUser = useCreateUser();

  const handleTabClick = (_event: React.MouseEvent<HTMLElement>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const handleCreateSmartProxy = async (data: SmartProxyFormData) => {
    try {
      await createSmartProxy.mutateAsync(data);
      setShowSmartProxyForm(false);
    } catch (error) {
      console.error('Failed to create smart proxy:', error);
    }
  };

  const handleCreateUser = async (data: UserFormData) => {
    try {
      await createUser.mutateAsync(data);
      setShowUserForm(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (userLoading) {
    return (
      <PageSection>
        <Spinner size="lg" />
      </PageSection>
    );
  }

  const isAdmin = currentUser?.admin;

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          System Administration
        </Title>
      </PageSection>

      <PageSection>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          <Tab eventKey="profile" title={<TabTitleText>User Profile</TabTitleText>}>
            <Grid hasGutter className="pf-v5-u-mt-md">
              <GridItem span={12}>
                <Card>
                  <CardTitle>User Profile Settings</CardTitle>
                  <CardBody>
                    <EmptyState>
                      <EmptyStateIcon icon={CogIcon} />
                      <Title headingLevel="h4" size="lg">
                        Profile Settings Coming Soon
                      </Title>
                      <EmptyStateBody>
                        User profile and preference settings will be available in a future release.
                        This will include options for themes, notifications, and display preferences.
                      </EmptyStateBody>
                    </EmptyState>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </Tab>

          {isAdmin && (
            <Tab eventKey="smartproxies" title={<TabTitleText><ServerIcon /> Smart Proxies</TabTitleText>}>
              <Grid hasGutter className="pf-v5-u-mt-md">
                <GridItem span={12}>
                  <Card>
                    <CardTitle>
                      Smart Proxy Management
                      <Button 
                        variant="primary" 
                        className="pf-v5-u-float-right"
                        icon={<PlusCircleIcon />}
                        onClick={() => setShowSmartProxyForm(true)}
                      >
                        Add Smart Proxy
                      </Button>
                    </CardTitle>
                    <CardBody>
                      {showSmartProxyForm ? (
                        <SmartProxyForm
                          onSubmit={handleCreateSmartProxy}
                          onCancel={() => setShowSmartProxyForm(false)}
                          isLoading={createSmartProxy.isLoading}
                          error={createSmartProxy.error as string}
                        />
                      ) : (
                        <>
                          {proxiesLoading ? (
                            <Spinner size="lg" />
                          ) : smartProxies?.results ? (
                            <SmartProxiesTable 
                              smartProxies={smartProxies.results}
                              isLoading={proxiesLoading}
                            />
                          ) : (
                            <EmptyState>
                              <EmptyStateIcon icon={ServerIcon} />
                              <Title headingLevel="h4" size="lg">
                                No Smart Proxies Found
                              </Title>
                              <EmptyStateBody>
                                Smart Proxies extend Foreman functionality to manage DNS, DHCP, TFTP and other services.
                                Add your first Smart Proxy to get started.
                              </EmptyStateBody>
                              <Button 
                                variant="primary" 
                                icon={<PlusCircleIcon />}
                                onClick={() => setShowSmartProxyForm(true)}
                              >
                                Add Smart Proxy
                              </Button>
                            </EmptyState>
                          )}
                        </>
                      )}
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            </Tab>
          )}

          {isAdmin && (
            <Tab eventKey="users" title={<TabTitleText><UsersIcon /> User Management</TabTitleText>}>
              <Grid hasGutter className="pf-v5-u-mt-md">
                <GridItem span={12}>
                  <Card>
                    <CardTitle>
                      User Management
                      <Button 
                        variant="primary" 
                        className="pf-v5-u-float-right"
                        icon={<PlusCircleIcon />}
                        onClick={() => setShowUserForm(true)}
                      >
                        Add User
                      </Button>
                    </CardTitle>
                    <CardBody>
                      {showUserForm ? (
                        <UserForm
                          onSubmit={handleCreateUser}
                          onCancel={() => setShowUserForm(false)}
                          isLoading={createUser.isLoading}
                          error={createUser.error as string}
                        />
                      ) : (
                        <>
                          {usersLoading ? (
                            <Spinner size="lg" />
                          ) : users?.results ? (
                            <UsersTable 
                              users={users.results}
                              isLoading={usersLoading}
                              currentUserId={currentUser?.id}
                            />
                          ) : (
                            <EmptyState>
                              <EmptyStateIcon icon={UsersIcon} />
                              <Title headingLevel="h4" size="lg">
                                No Users Found
                              </Title>
                              <EmptyStateBody>
                                Manage Foreman users, roles, and permissions.
                                Add your first user to get started.
                              </EmptyStateBody>
                              <Button 
                                variant="primary" 
                                icon={<PlusCircleIcon />}
                                onClick={() => setShowUserForm(true)}
                              >
                                Add User
                              </Button>
                            </EmptyState>
                          )}
                        </>
                      )}
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            </Tab>
          )}

          {isAdmin && (
            <Tab eventKey="system" title={<TabTitleText><GlobeIcon /> System Settings</TabTitleText>}>
              <Grid hasGutter className="pf-v5-u-mt-md">
                <GridItem span={12}>
                  <Card>
                    <CardTitle>Global System Settings</CardTitle>
                    <CardBody>
                      <EmptyState>
                        <EmptyStateIcon icon={GlobeIcon} />
                        <Title headingLevel="h4" size="lg">
                          System Settings Coming Soon
                        </Title>
                        <EmptyStateBody>
                          Global system configuration will be available in a future release.
                          This will include options for default values, plugin settings, and system preferences.
                        </EmptyStateBody>
                      </EmptyState>
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            </Tab>
          )}
        </Tabs>

        {!isAdmin && (
          <Alert 
            variant="info" 
            title="Limited Access"
            className="pf-v5-u-mt-md"
          >
            You have limited access to system administration features. 
            Contact your administrator for elevated permissions.
          </Alert>
        )}
      </PageSection>
    </>
  );
};