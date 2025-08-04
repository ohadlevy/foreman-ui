import React, { useState } from 'react';
import {
  Popover,
  Button,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Divider,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import {
  CubesIcon,
  ServerIcon,
  SearchIcon,
  ExternalLinkAltIcon,
  HistoryIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { useActivityStore } from '../../stores/activityStore';
import { formatRelativeTime } from '../../utils/formatting';

// UI constants - use PatternFly sizing token for consistency
const RECENT_ITEM_MAX_WIDTH = 'var(--pf-global--Width--sm)';

export interface QuickNavProps {
  maxRecentItems?: number;
  className?: string;
}

export const QuickNav: React.FC<QuickNavProps> = ({
  maxRecentItems = 6,
  className
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { recentActivity } = useActivityStore();

  const quickLinks = [
    { label: 'All Hosts', url: '/hosts', icon: <ServerIcon /> },
    { label: 'Dashboard', url: '/dashboard', icon: <CubesIcon /> },
    { label: 'My Profile', url: '/profile', icon: <ExternalLinkAltIcon /> },
  ];

  const recentItems = recentActivity.slice(0, maxRecentItems);

  const handleItemClick = (url: string) => {
    setIsOpen(false);
    navigate(url);
  };

  const popoverContent = (
    <div className="pf-v5-u-min-width-280px pf-v5-u-max-width-400px">
      {/* Quick Links */}
      <div className="pf-v5-u-mb-md">
        <div className="pf-v5-u-font-weight-bold pf-v5-u-mb-sm pf-v5-u-px-md pf-v5-u-color-200">
          Quick Links
        </div>
        <Menu>
          <MenuContent>
            <MenuList>
              {quickLinks.map((link) => (
                <MenuItem
                  key={link.url}
                  onClick={() => handleItemClick(link.url)}
                  icon={link.icon}
                >
                  {link.label}
                </MenuItem>
              ))}
            </MenuList>
          </MenuContent>
        </Menu>
      </div>

      <Divider />

      {/* Recent Activity */}
      <div className="pf-v5-u-mt-md">
        <div className="pf-v5-u-font-weight-bold pf-v5-u-mb-sm pf-v5-u-px-md pf-v5-u-color-200">
          Recent Activity
        </div>

        {recentItems.length === 0 ? (
          <EmptyState variant="xs">
            <EmptyStateIcon icon={HistoryIcon} />
            <EmptyStateBody>
              No recent activity
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Menu>
            <MenuContent>
              <MenuList>
                {recentItems.map((activity) => (
                  <MenuItem
                    key={activity.id}
                    onClick={() => handleItemClick(activity.url)}
                    icon={
                      activity.type.includes('host') ? <ServerIcon /> :
                      activity.type === 'search' ? <SearchIcon /> :
                      <ExternalLinkAltIcon />
                    }
                    description={formatRelativeTime(activity.timestamp)}
                  >
                    <div className="pf-v5-u-text-truncate pf-v5-u-text-nowrap" style={{ maxWidth: RECENT_ITEM_MAX_WIDTH }}>
                      {activity.title}
                    </div>
                  </MenuItem>
                ))}
              </MenuList>
            </MenuContent>
          </Menu>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      aria-label="Quick Navigation"
      bodyContent={popoverContent}
      isVisible={isOpen}
      onHidden={() => setIsOpen(false)}
      position="bottom-start"
      hasAutoWidth
    >
      <Button
        variant="tertiary"
        icon={<CubesIcon />}
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        aria-label="Quick navigation"
      >
        Quick Nav
      </Button>
    </Popover>
  );
};