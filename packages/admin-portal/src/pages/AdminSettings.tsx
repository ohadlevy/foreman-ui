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

export const AdminSettings: React.FC = () => {
  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Global Settings
        </Title>
        <p>Configure system-wide settings and default values</p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>System Configuration</CardTitle>
          <CardBody>
            <EmptyState>
              <EmptyStateIcon icon={CogIcon} />
              <Title headingLevel="h4" size="lg">
                Global Settings Coming Soon
              </Title>
              <EmptyStateBody>
                Global system configuration will be available in a future release.
                This will include options for default values, plugin settings, 
                authentication configuration, and system preferences.
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};