import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  NotificationDrawer as PFNotificationDrawer,
  NotificationDrawerHeader,
  NotificationDrawerBody,
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateBody,
  Button,
  Spinner,
  Alert,
} from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons';
import { NotificationGroup } from './NotificationGroup';
import { useNotificationStore } from '../../stores/notificationStore';
import { useNotifications, useNotificationActions } from '../../hooks/useNotifications';

interface NotificationDrawerProps {
  children: React.ReactNode;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ children }) => {
  const { 
    isDrawerOpen, 
    setDrawerOpen, 
    getGroupedNotifications, 
    unreadCount,
    error,
    isLoading 
  } = useNotificationStore();
  
  const { refetch } = useNotifications();
  const { clearGroup } = useNotificationActions();

  const groupedNotifications = getGroupedNotifications();
  const groupEntries = Object.entries(groupedNotifications);
  const hasNotifications = groupEntries.length > 0;

  const handleClose = () => {
    setDrawerOpen(false);
  };


  const handleClearAll = () => {
    // Clear all groups
    groupEntries.forEach(([groupName]) => {
      clearGroup(groupName);
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const drawerContent = (
    <DrawerPanelContent widths={{ default: 'width_33' }}>
      <DrawerHead>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Notifications</h2>
          <DrawerActions>
            <DrawerCloseButton onClick={handleClose} />
          </DrawerActions>
        </div>
      </DrawerHead>
      <DrawerContentBody>
        <PFNotificationDrawer>
          <NotificationDrawerHeader
            title="Notifications"
            customText={unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasNotifications && (
                <Button variant="plain" onClick={handleClearAll} size="sm">
                  Clear all
                </Button>
              )}
              <Button variant="plain" onClick={handleRefresh} size="sm">
                Refresh
              </Button>
            </div>
          </NotificationDrawerHeader>
          <NotificationDrawerBody>
            {error && (
              <Alert variant="danger" title="Error loading notifications" isInline>
                {error}
              </Alert>
            )}
            
            {isLoading && !hasNotifications && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="lg" />
                <div style={{ marginTop: '1rem' }}>Loading notifications...</div>
              </div>
            )}

            {!isLoading && !error && !hasNotifications && (
              <EmptyState variant={EmptyStateVariant.sm}>
                <EmptyStateIcon icon={BellIcon} />
                <EmptyStateBody>
                  No notifications to display.
                </EmptyStateBody>
              </EmptyState>
            )}

            {hasNotifications && (
              <>
                {groupEntries.map(([groupName, group]) => (
                  <NotificationGroup key={groupName} group={group} />
                ))}
              </>
            )}
          </NotificationDrawerBody>
        </PFNotificationDrawer>
      </DrawerContentBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer isExpanded={isDrawerOpen}>
      <DrawerContent panelContent={drawerContent}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};