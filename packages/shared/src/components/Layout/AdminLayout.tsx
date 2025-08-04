import React from 'react';
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  NavExpandable,
  PageSection,
} from '@patternfly/react-core';
import { 
  CogIcon, 
  UsersIcon, 
  ChartAreaIcon,
  DatabaseIcon,
  NetworkIcon 
} from '@patternfly/react-icons';
import { Link, useLocation } from 'react-router-dom';
import { ForemanBrand } from '../Branding';
import { NotificationBell } from '../Notifications';
import { ModeSwitcher } from '../ModeSwitcher';
// import { UserProfile } from '../UserProfile'; // Temporarily disabled due to QueryClient dependency

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadBrand onClick={() => window.location.href = '/admin/overview'}>
          <ForemanBrand />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ModeSwitcher />
          <NotificationBell />
          {/* <UserProfile /> Temporarily disabled */}
        </div>
      </MastheadContent>
    </Masthead>
  );

  const adminNavigation = [
    {
      title: 'System Overview',
      path: '/admin/overview',
      icon: <ChartAreaIcon />,
    },
    {
      title: 'Infrastructure',
      icon: <NetworkIcon />,
      children: [
        { title: 'Smart Proxies', path: '/admin/infrastructure/smart-proxies' },
        { title: 'Compute Resources', path: '/admin/infrastructure/compute-resources' },
        { title: 'Subnets', path: '/admin/infrastructure/subnets' },
        { title: 'Domains', path: '/admin/infrastructure/domains' },
      ],
    },
    {
      title: 'User Management',
      icon: <UsersIcon />,
      children: [
        { title: 'Users', path: '/admin/users' },
        { title: 'User Groups', path: '/admin/user-groups' },
        { title: 'Roles', path: '/admin/roles' },
        { title: 'Permissions', path: '/admin/permissions' },
      ],
    },
    {
      title: 'Configuration',
      icon: <CogIcon />,
      children: [
        { title: 'Global Settings', path: '/admin/settings' },
        { title: 'Provisioning Templates', path: '/admin/provisioning-templates' },
        { title: 'Partition Tables', path: '/admin/partition-tables' },
      ],
    },
    {
      title: 'Monitor',
      icon: <DatabaseIcon />,
      children: [
        { title: 'System Status', path: '/admin/monitor/status' },
        { title: 'Logs', path: '/admin/monitor/logs' },
        { title: 'Tasks', path: '/admin/monitor/tasks' },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (children: Array<{ path: string }>) => 
    children.some(child => location.pathname === child.path);

  const navigation = (
    <Nav>
      <NavList>
        {adminNavigation.map((item) => {
          if (item.children) {
            return (
              <NavExpandable
                key={item.title}
                title={item.title}
                isActive={isGroupActive(item.children)}
                isExpanded={isGroupActive(item.children)}
              >
                {item.children.map((child) => (
                  <NavItem
                    key={child.path}
                    isActive={isActive(child.path)}
                  >
                    <Link to={child.path}>{child.title}</Link>
                  </NavItem>
                ))}
              </NavExpandable>
            );
          }

          return (
            <NavItem key={item.path} isActive={isActive(item.path!)}>
              <Link to={item.path!}>
                {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
                {item.title}
              </Link>
            </NavItem>
          );
        })}
      </NavList>
    </Nav>
  );

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        {navigation}
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page 
      header={masthead} 
      sidebar={sidebar}
      isManagedSidebar
    >
      <PageSection variant="light" style={{ minHeight: '100vh' }}>
        {children}
      </PageSection>
    </Page>
  );
};