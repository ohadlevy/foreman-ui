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
} from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';

export const Settings: React.FC = () => {
  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Settings
        </Title>
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
                This will include options for themes, notifications, and display preferences.
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};