import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Alert,
  Button,
} from '@patternfly/react-core';
import { CogIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useCurrentUser, useMode } from '@foreman/shared';

export const Settings: React.FC = () => {
  const { data: currentUser } = useCurrentUser();
  const { switchMode } = useMode();

  const isAdmin = currentUser?.admin;

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Settings
        </Title>
        <p>Manage your personal preferences and account settings</p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>User Preferences</CardTitle>
          <CardBody>
            <EmptyState>
              <EmptyStateIcon icon={CogIcon} />
              <Title headingLevel="h4" size="lg">
                Settings Coming Soon
              </Title>
              <EmptyStateBody>
                User settings and preferences will be available in a future release.
                This will include options for themes, notifications, display preferences,
                and personal account management.
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        </Card>

        {isAdmin && (
          <Alert 
            variant="info" 
            title="System Administration"
            className="pf-v5-u-mt-md"
            actionClose={false}
            actionLinks={
              <Button 
                variant="link" 
                icon={<ExternalLinkAltIcon />}
                onClick={() => switchMode('admin')}
              >
                Go to Admin Portal
              </Button>
            }
          >
            You have administrator privileges. Switch to Admin Mode to manage 
            users, Smart Proxies, and system-wide configuration.
          </Alert>
        )}
      </PageSection>
    </>
  );
};