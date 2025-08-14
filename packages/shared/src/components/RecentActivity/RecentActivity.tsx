import React from 'react';
import {
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Divider,
  EmptyState,
  EmptyStateBody,
  Badge,
} from '@patternfly/react-core';
import {
  ServerIcon,
  SearchIcon,
  FileIcon,
  ClockIcon,
  HistoryIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { useActivityStore, ActivityItem } from '../../stores/activityStore';
import { formatRelativeTime } from '../../utils/formatting';

export interface RecentActivityProps {
  maxItems?: number;
  showClearButton?: boolean;
  onItemSelect?: (activity: ActivityItem) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  maxItems = 10,
  showClearButton = true,
  onItemSelect,
}) => {
  const navigate = useNavigate();
  const { recentActivity, clearActivity } = useActivityStore();

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'host_view':
      case 'host_edit':
      case 'host_create':
        return <ServerIcon />;
      case 'search':
        return <SearchIcon />;
      case 'page_visit':
        return <FileIcon />;
      default:
        return <ClockIcon />;
    }
  };


  const handleItemClick = (activity: ActivityItem) => {
    onItemSelect?.(activity);
    navigate(activity.url);
  };

  const displayedActivity = recentActivity.slice(0, maxItems);

  if (recentActivity.length === 0) {
    return (
      <EmptyState 
        variant="xs"
        titleText="No recent activity"
        icon={HistoryIcon}
      >
        <EmptyStateBody>
          Your recent interactions will appear here.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Menu>
      <MenuContent>
        <MenuList>
          {displayedActivity.map((activity) => (
            <MenuItem
              key={activity.id}
              onClick={() => handleItemClick(activity)}
              icon={getActivityIcon(activity.type)}
              description={
                <div className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-gap-sm">
                  {activity.subtitle && (
                    <Badge isRead={false}>
                      {activity.subtitle}
                    </Badge>
                  )}
                  <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              }
            >
              {activity.title}
            </MenuItem>
          ))}

          {showClearButton && (
            <>
              <Divider />
              <MenuItem onClick={clearActivity}>
                Clear history
              </MenuItem>
            </>
          )}
        </MenuList>
      </MenuContent>
    </Menu>
  );
};

// Specialized components for different activity types
export const RecentHosts: React.FC<Omit<RecentActivityProps, 'maxItems'>> = (props) => {
  const navigate = useNavigate();
  const { getRecentHosts } = useActivityStore();
  const recentHosts = getRecentHosts();

  if (recentHosts.length === 0) {
    return (
      <EmptyState 
        variant="xs"
        titleText="No recent hosts"
        icon={ServerIcon}
      >
        <EmptyStateBody>
          Your recently viewed hosts will appear here.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Menu>
      <MenuContent>
        <MenuList>
          {recentHosts.map((activity) => (
            <MenuItem
              key={activity.id}
              onClick={() => {
                props.onItemSelect?.(activity);
                navigate(activity.url);
              }}
              description={formatRelativeTime(activity.timestamp)}
            >
              {activity.title}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );
};

export const RecentSearches: React.FC<Omit<RecentActivityProps, 'maxItems'>> = (props) => {
  const navigate = useNavigate();
  const { getRecentSearches } = useActivityStore();
  const recentSearches = getRecentSearches();

  if (recentSearches.length === 0) {
    return (
      <EmptyState 
        variant="xs"
        titleText="No recent searches"
        icon={SearchIcon}
      >
        <EmptyStateBody>
          Your recent search queries will appear here.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Menu>
      <MenuContent>
        <MenuList>
          {recentSearches.map((activity) => (
            <MenuItem
              key={activity.id}
              onClick={() => {
                props.onItemSelect?.(activity);
                navigate(activity.url);
              }}
              description={activity.subtitle}
            >
              {activity.title}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );
};