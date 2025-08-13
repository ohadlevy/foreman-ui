import React, { ReactNode } from 'react';
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Nav,
  NavList,
  NavItem,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import {
  BarsIcon,
  UserIcon,
  CogIcon,
  SignOutAltIcon,
} from '@patternfly/react-icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import { usePermissions } from '../../hooks';
import { usePluginMenuItems } from '../../plugins/hooks';
import { hasPluginPermissions } from '../../plugins/utils';
import { ForemanBrand } from '../Branding';
import { NotificationBell, NotificationDrawer } from '../Notifications';
import { QuickNav } from '../QuickNav';
import { TaxonomyCompactSelector } from '../TaxonomySelector';
import { TaxonomyProvider } from '../../providers';
import { SkipToContent } from './SkipToContent';

interface UserLayoutProps {
  children: ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canViewHosts, canCreateHosts } = usePermissions();
  const pluginMenuItems = usePluginMenuItems();

  const [isNavOpen, setIsNavOpen] = React.useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);

  // Get user permissions for filtering plugin menu items
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];

  const onNavToggle = () => {
    setIsNavOpen(!isNavOpen);
  };

  const onUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter plugin menu items by permissions
  const filteredPluginMenuItems = pluginMenuItems.filter(item =>
    hasPluginPermissions(item.permissions, userPermissions)
  );

  const navigation = (
    <Nav>
      <NavList>
        <NavItem isActive={location.pathname === '/dashboard'}>
          <Link to="/dashboard">Dashboard</Link>
        </NavItem>
        {canViewHosts() && (
          <NavItem isActive={location.pathname.startsWith('/hosts')}>
            <Link to="/hosts">My Hosts</Link>
          </NavItem>
        )}
        {canCreateHosts() && (
          <NavItem isActive={location.pathname === '/register'}>
            <Link to="/register">Register Host</Link>
          </NavItem>
        )}
        <NavItem isActive={location.pathname === '/profile'}>
          <Link to="/profile">Profile</Link>
        </NavItem>
        <NavItem isActive={location.pathname === '/system-status'}>
          <Link to="/system-status">System Status</Link>
        </NavItem>

        {/* Plugin Menu Items */}
        {filteredPluginMenuItems.map((item) => (
          item.path && (
            <NavItem
              key={item.id}
              isActive={location.pathname === item.path}
            >
              <Link to={item.path}>
                {item.labelKey ? item.labelKey : item.label}
              </Link>
            </NavItem>
          )
        ))}
      </NavList>
    </Nav>
  );

  const userDropdownItems = (
    <DropdownList>
      <DropdownItem
        key="profile"
        icon={<UserIcon />}
        onClick={() => navigate('/profile')}
      >
        Profile
      </DropdownItem>
      <DropdownItem
        key="settings"
        icon={<CogIcon />}
        onClick={() => navigate('/settings')}
      >
        Settings
      </DropdownItem>
      <DropdownItem
        key="logout"
        icon={<SignOutAltIcon />}
        onClick={handleLogout}
      >
        Logout
      </DropdownItem>
    </DropdownList>
  );

  const headerToolbar = (
    <Toolbar id="toolbar" isFullHeight>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignRight' }}>
          <ToolbarItem>
            <QuickNav />
          </ToolbarItem>
          <ToolbarItem>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NotificationBell />
              <Dropdown
                isOpen={isUserDropdownOpen}
                onSelect={onUserDropdownToggle}
                onOpenChange={(isOpen: boolean) => setIsUserDropdownOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onUserDropdownToggle}
                    isExpanded={isUserDropdownOpen}
                    icon={<UserIcon />}
                  >
                    {user?.firstname && user?.lastname
                      ? `${user.firstname} ${user.lastname}`
                      : user?.login || 'User'}
                  </MenuToggle>
                )}
              >
                {userDropdownItems}
              </Dropdown>
            </div>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isNavOpen}
          onSidebarToggle={onNavToggle}
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <ForemanBrand
            size="md"
            showText={true}
            onClick={() => navigate('/dashboard')}
          />
        </MastheadBrand>
        <TaxonomyCompactSelector />
      </MastheadMain>
      <MastheadContent>{headerToolbar}</MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>{navigation}</PageSidebarBody>
    </PageSidebar>
  );

  return (
    <TaxonomyProvider>
      <NotificationDrawer>
        <Page
          header={header}
          sidebar={sidebar}
          isManagedSidebar
          skipToContent={
            <SkipToContent href="#main-content">
              Skip to content
            </SkipToContent>
          }
        >
          <div id="main-content">
            {children}
          </div>
        </Page>
      </NotificationDrawer>
    </TaxonomyProvider>
  );
};