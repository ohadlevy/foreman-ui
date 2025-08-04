import React from 'react';
import {
  Button,
  Badge,
  Tooltip,
} from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons';
import { useNotificationStore } from '../../stores/notificationStore';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationBell: React.FC = () => {
  const { toggleDrawer, unreadCount, isDrawerOpen } = useNotificationStore();

  // Initialize notifications on mount
  useNotifications();

  const handleClick = () => {
    toggleDrawer();
  };

  return (
    <Tooltip content="Notifications">
      <Button
        variant="plain"
        onClick={handleClick}
        isActive={isDrawerOpen}
        icon={
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <BellIcon />
            {unreadCount > 0 && (
              <Badge
                isRead={false}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  minWidth: '16px',
                  height: '16px',
                  fontSize: '10px',
                  borderRadius: '8px',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        }
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      />
    </Tooltip>
  );
};