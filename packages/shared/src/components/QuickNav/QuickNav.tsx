import React, { useState } from 'react';
import {
  Popover,
  Button,
  Divider,
  EmptyState,
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
import styles from './QuickNav.module.css';

// QuickNav component for quick access to common actions and recent activity

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
    <div className={styles.popoverContent}>
      <div className="pf-v6-l-flex pf-m-space-items-sm pf-m-column">
        {/* Quick Links Section */}
        <div className="">
          <div className="pf-v6-l-flex pf-m-space-items-xs pf-m-column">
            <h6 className={`pf-v6-c-content--h6 ${styles.sectionTitle}`}>Quick Links</h6>
            
            {quickLinks.map((link) => (
              <button 
                key={link.url}
                className={styles.quickLinkItem}
                onClick={() => handleItemClick(link.url)}
                type="button"
                aria-label={`Navigate to ${link.label}`}
              >
                <span className="pf-v6-c-icon pf-m-sm">
                  <span className="pf-v6-c-icon__content">
                    {link.icon}
                  </span>
                </span>
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Recent Activity Section */}
        <div className="">
          <div className="pf-v6-l-flex pf-m-space-items-xs pf-m-column">
            <h6 className={`pf-v6-c-content--h6 ${styles.sectionTitle}`}>Recent Activity</h6>
            
            <div className={styles.recentActivityContainer}>
              {recentItems.length === 0 ? (
                <div className={styles.emptyStateContainer}>
                  <EmptyState 
                    variant="xs"
                    titleText="No recent activity"
                    icon={HistoryIcon}
                  >
                    <EmptyStateBody>
                      Your recent activities will appear here
                    </EmptyStateBody>
                  </EmptyState>
                </div>
              ) : (
                recentItems.map((activity) => (
                  <button 
                    key={activity.id}
                    className={styles.recentItem}
                    onClick={() => handleItemClick(activity.url)}
                    type="button"
                    aria-label={`Navigate to ${activity.title}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span className="pf-v6-c-icon pf-m-sm">
                        <span className="pf-v6-c-icon__content">
                          {activity.type.includes('host') ? <ServerIcon /> :
                           activity.type === 'search' ? <SearchIcon /> :
                           <ExternalLinkAltIcon />}
                        </span>
                      </span>
                      <div className={styles.recentItemContent}>
                        <div className={styles.recentItemLabel}>
                          {activity.title}
                        </div>
                        <div className={styles.recentItemTime}>
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
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
    >
      <Button
        variant="plain"
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        aria-label="Quick navigation"
        icon={<CubesIcon />}
      />
    </Popover>
  );
};