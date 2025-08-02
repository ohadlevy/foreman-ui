import React from 'react';
import {
  NotificationDrawerGroup,
  NotificationDrawerGroupList,
  Button,
  Flex,
  FlexItem,
  Badge,
} from '@patternfly/react-core';
import { CheckIcon, TimesIcon } from '@patternfly/react-icons';
import { NotificationItem } from './NotificationItem';
import type { NotificationGroupData } from '../../stores/notificationStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useNotificationActions } from '../../hooks/useNotifications';

interface NotificationGroupProps {
  group: NotificationGroupData;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({ group }) => {
  const { expandedGroup, expandGroup } = useNotificationStore();
  const { markGroupAsRead, clearGroup, isLoading } = useNotificationActions();

  const isExpanded = expandedGroup === group.name;
  const hasUnread = group.unreadCount > 0;

  const handleToggle = () => {
    expandGroup(group.name);
  };

  const handleMarkGroupAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markGroupAsRead(group.name);
  };

  const handleClearGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearGroup(group.name);
  };

  const groupTitle = (
    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            {group.name}
          </FlexItem>
          {hasUnread && (
            <FlexItem>
              <Badge isRead={false}>
                {group.unreadCount}
              </Badge>
            </FlexItem>
          )}
        </Flex>
      </FlexItem>
      <FlexItem>
        <Flex spaceItems={{ default: 'spaceItemsXs' }}>
          {hasUnread && (
            <FlexItem>
              <Button
                variant="plain"
                onClick={handleMarkGroupAsRead}
                isDisabled={isLoading}
                icon={<CheckIcon />}
                aria-label="Mark all as read"
                size="sm"
              />
            </FlexItem>
          )}
          <FlexItem>
            <Button
              variant="plain"
              onClick={handleClearGroup}
              isDisabled={isLoading}
              icon={<TimesIcon />}
              aria-label="Clear all notifications"
              size="sm"
            />
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );

  return (
    <NotificationDrawerGroup
      title={groupTitle}
      isExpanded={isExpanded}
      onExpand={handleToggle}
      count={group.notifications.length}
      isRead={!hasUnread}
    >
      <NotificationDrawerGroupList>
        {group.notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </NotificationDrawerGroupList>
    </NotificationDrawerGroup>
  );
};