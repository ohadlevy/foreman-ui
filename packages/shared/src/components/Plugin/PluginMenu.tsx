import React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../utils/useTranslation';
import { usePluginMenuItems } from '../../plugins/hooks';
import { useAuthStore } from '../../auth/store';
import { filterMenuItemsByPermissions, buildMenuHierarchy } from '../../plugins/utils';

interface PluginMenuProps {
  /** Optional parent menu ID to filter menu items */
  parentId?: string;
  /** Whether to render as horizontal nav */
  isHorizontal?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Menu component that renders plugin-provided menu items
 * Supports hierarchical menus and permission filtering
 */
export const PluginMenu: React.FC<PluginMenuProps> = ({
  parentId,
  isHorizontal = false,
  className
}) => {
  const { t } = useTranslation();
  const menuItems = usePluginMenuItems();
  const { user } = useAuthStore();

  // Get user permissions for filtering
  const userPermissions = user?.roles?.flatMap(role => role.permissions || []) || [];

  // Filter menu items by permissions
  const filteredItems = filterMenuItemsByPermissions(menuItems, userPermissions);

  // Build menu hierarchy
  const hierarchicalItems = buildMenuHierarchy(filteredItems);

  // Filter by parent ID if specified, flattening children for rendering
  const itemsToRender = parentId
    ? filteredItems.filter(item => item.parent === parentId)
    : hierarchicalItems.reduce((acc, item) => {
        acc.push(item);
        if (item.children) {
          acc.push(...item.children);
        }
        return acc;
      }, [] as typeof menuItems);

  if (itemsToRender.length === 0) {
    return null;
  }

  const renderMenuItem = (item: typeof menuItems[0]) => {
    const label = item.labelKey ? t(item.labelKey) : item.label || item.id;

    // For now, render all items as flat nav items
    // TODO: Implement proper expandable nav groups when needed
    return (
      <NavItem key={item.id}>
        {item.path ? (
          <Link to={item.path}>{label}</Link>
        ) : (
          <span>{label}</span>
        )}
      </NavItem>
    );
  };

  return (
    <Nav
      className={className}
      variant={isHorizontal ? 'horizontal' : 'default'}
      aria-label="Plugin navigation"
    >
      <NavList>
        {itemsToRender.map(item => renderMenuItem(item))}
      </NavList>
    </Nav>
  );
};

export default PluginMenu;