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

// Styles for action overlay positioning
const OVERLAY_STYLES = {
  position: 'absolute' as const,
  top: '12px',
  right: '120px', // Move further left to avoid expand icon area
  display: 'flex',
  gap: '8px',
  zIndex: 10,
  pointerEvents: 'auto' as const
};

// Container styles for positioning context
const CONTAINER_STYLES = {
  position: 'relative' as const
};

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent group toggle
  };

  // Props for group title flex layout
  const groupTitleFlexProps = {
    alignItems: { default: 'alignItemsCenter' as const },
    spaceItems: { default: 'spaceItemsSm' as const }
  };

  const groupTitle = (
    <Flex {...groupTitleFlexProps}>
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
  );

  // TODO: This is a workaround for PatternFly's NotificationDrawerGroup
  // not supporting action buttons without DOM nesting. We overlay the actions
  // on the group header to avoid layout disruption. We should propose an
  // 'actions' prop to PatternFly to handle this properly.
  // See: https://github.com/patternfly/patternfly-react/issues/[TBD]
  
  return (
    <section style={CONTAINER_STYLES} aria-label={`Notification group: ${group.name}`}>
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
      
      {/* Overlay actions on the group header */}
      <div
        style={OVERLAY_STYLES}
        onClick={handleOverlayClick}
      >
        {hasUnread && (
          <Button
            variant="plain"
            onClick={handleMarkGroupAsRead}
            isDisabled={isLoading}
            icon={<CheckIcon />}
            aria-label={`Mark all ${group.name} notifications as read`}
            size="sm"
          />
        )}
        <Button
          variant="plain"
          onClick={handleClearGroup}
          isDisabled={isLoading}
          icon={<TimesIcon />}
          aria-label={`Clear all ${group.name} notifications`}
          size="sm"
        />
      </div>
    </section>
  );
};