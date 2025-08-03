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

// Action overlay positioning constants
// The right offset for the action overlay is calculated as follows:
// - Expand icon area: 48px (width of expand/collapse button)
// - Button width: 56px (width of action buttons) 
// - Padding: 16px (space between icon/button and overlay)
// Total: 48px + 56px + 16px = 120px
const ACTION_OVERLAY_RIGHT_OFFSET = '120px';
const ACTION_OVERLAY_TOP_OFFSET = '12px';
const ACTION_BUTTON_GAP = '8px';
const ACTION_OVERLAY_Z_INDEX = 10;


// Container styles for positioning context  
const CONTAINER_STYLES = {
  position: 'relative' as const
};

// Utility function to create consistent action overlay styles
const createActionOverlayStyles = () => ({
  position: 'absolute' as const,
  top: ACTION_OVERLAY_TOP_OFFSET,
  right: ACTION_OVERLAY_RIGHT_OFFSET,
  display: 'flex',
  gap: ACTION_BUTTON_GAP,
  zIndex: ACTION_OVERLAY_Z_INDEX,
  pointerEvents: 'auto' as const
});

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
  
  return (
    <div style={CONTAINER_STYLES}>
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
        role="group"
        aria-label={`Actions for ${group.name} notifications`}
        style={createActionOverlayStyles()}
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
    </div>
  );
};