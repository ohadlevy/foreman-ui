import React from 'react';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Title,
  Breadcrumb,
  BreadcrumbItem,
  Button
} from '@patternfly/react-core';
import { UserProfile } from './UserProfile';

// Example usage of UserProfile component
export const UserProfilePage: React.FC = () => {
  return (
    <Page>
      <PageSection variant={PageSectionVariants.default}>
        <Breadcrumb>
          <BreadcrumbItem to="/">Home</BreadcrumbItem>
          <BreadcrumbItem to="/profile" isActive>Profile</BreadcrumbItem>
        </Breadcrumb>
        <Title headingLevel="h1" size="lg">
          User Profile
        </Title>
      </PageSection>

      <PageSection>
        <UserProfile />
      </PageSection>
    </Page>
  );
};

// Example usage in a dropdown menu
export const UserDropdownWithProfile: React.FC<{ onNavigateToProfile: () => void }> = ({
  onNavigateToProfile
}) => {
  return (
    <div>
      <Button variant="link" onClick={onNavigateToProfile}>
        View Profile & Manage Tokens
      </Button>
    </div>
  );
};