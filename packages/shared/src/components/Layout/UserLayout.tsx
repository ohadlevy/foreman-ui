import React, { ReactNode } from 'react';
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadLogo,
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

  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);

  // Get user permissions for filtering plugin menu items
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];

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


  const header = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo>
            <ForemanBrand
              size="md"
              showText={true}
              onClick={() => navigate('/dashboard')}
            />
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="masthead-toolbar" isFullHeight>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <TaxonomyCompactSelector />
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>
                <QuickNav />
              </ToolbarItem>
              <ToolbarItem>
                <NotificationBell />
              </ToolbarItem>
              <ToolbarItem>
                <Dropdown
                  isOpen={isUserDropdownOpen}
                  onSelect={onUserDropdownToggle}
                  onOpenChange={(isOpen: boolean) => setIsUserDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={onUserDropdownToggle}
                      isExpanded={isUserDropdownOpen}
                      variant="plain"
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
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
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
          masthead={header}
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