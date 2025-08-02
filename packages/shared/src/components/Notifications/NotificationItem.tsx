import React from 'react';
import {
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  Button,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { TimesIcon, CheckIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import type { NotificationRecipient } from '../../stores/notificationStore';
import { useNotificationActions } from '../../hooks/useNotifications';
import { formatUserFriendlyDate } from '../../utils/formatting';

interface NotificationItemProps {
  notification: NotificationRecipient;
}

const getVariantFromLevel = (level: string) => {
  switch (level) {
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'success':
      return 'success';
    case 'info':
    default:
      return 'info';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead, clearNotification, isLoading } = useNotificationActions();

  const handleMarkAsRead = () => {
    if (!notification.seen) {
      markAsRead(notification.id);
    }
  };

  const handleClear = () => {
    clearNotification(notification.id);
  };

  const getNotificationUrl = (): string | null => {
    if (!notification.actions) return null;
    
    const actions = notification.actions as Record<string, unknown>;
    
    // Look for common action patterns that contain URLs
    if (actions.links && Array.isArray(actions.links)) {
      const firstLink = actions.links[0] as Record<string, unknown>;
      if (firstLink && firstLink.href) {
        return firstLink.href as string;
      }
    }
    
    // Check for a direct URL field
    if (actions.url || actions.href || actions.link) {
      const url = actions.url || actions.href || actions.link;
      if (typeof url === 'string') {
        return url;
      }
    }
    
    // Check for action objects with URLs
    for (const action of Object.values(actions)) {
      if (action && typeof action === 'object') {
        const actionObj = action as Record<string, unknown>;
        if (actionObj.url || actionObj.href) {
          return (actionObj.url || actionObj.href) as string;
        }
      }
    }
    
    return null;
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getNotificationUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      handleMarkAsRead();
    }
  };

  const notificationUrl = getNotificationUrl();

  return (
    <NotificationDrawerListItem
      variant={getVariantFromLevel(notification.level)}
      isRead={notification.seen}
      onClick={handleMarkAsRead}
    >
      <NotificationDrawerListItemHeader
        variant={getVariantFromLevel(notification.level)}
        title={notification.text}
        srTitle={`${notification.level} notification`}
      >
        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
          {notificationUrl && (
            <FlexItem>
              <Button
                variant="link"
                onClick={handleOpenLink}
                isDisabled={isLoading}
                icon={<ExternalLinkAltIcon />}
                size="sm"
              >
                More info
              </Button>
            </FlexItem>
          )}
          {!notification.seen && (
            <FlexItem>
              <Button
                variant="plain"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead();
                }}
                isDisabled={isLoading}
                icon={<CheckIcon />}
                aria-label="Mark as read"
                size="sm"
              />
            </FlexItem>
          )}
          <FlexItem>
            <Button
              variant="plain"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              isDisabled={isLoading}
              icon={<TimesIcon />}
              aria-label="Clear notification"
              size="sm"
            />
          </FlexItem>
        </Flex>
      </NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody timestamp={formatUserFriendlyDate(notification.created_at)}>
        {/* Additional details could go here if needed */}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};