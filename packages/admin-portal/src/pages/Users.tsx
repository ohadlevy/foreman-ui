import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
} from '@patternfly/react-core';
import { PlusCircleIcon, UsersIcon } from '@patternfly/react-icons';
import { 
  useUsers, 
  useCreateUser,
  useCurrentUser,
  UsersTable,
  UserForm,
  UserFormData
} from '@foreman/shared';

export const Users: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  const { data: users, isLoading } = useUsers();
  const { data: currentUser } = useCurrentUser();
  const createUser = useCreateUser();

  const handleCreate = async (data: UserFormData) => {
    try {
      await createUser.mutateAsync(data);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          User Management
        </Title>
        <p>Manage Foreman users, their roles, permissions, and access control</p>
      </PageSection>

      <PageSection>
        <Card>
          <CardTitle>
            Users
            {!showForm && (
              <Button 
                variant="primary" 
                className="pf-v5-u-float-right"
                icon={<PlusCircleIcon />}
                onClick={() => setShowForm(true)}
              >
                Add User
              </Button>
            )}
          </CardTitle>
          <CardBody>
            {showForm ? (
              <UserForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                isLoading={createUser.isLoading}
                error={createUser.error as string}
              />
            ) : (
              <>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner size="lg" />
                  </div>
                ) : users?.results && users.results.length > 0 ? (
                  <UsersTable 
                    users={users.results}
                    isLoading={isLoading}
                    currentUserId={currentUser?.id}
                  />
                ) : (
                  <EmptyState>
                    <EmptyStateIcon icon={UsersIcon} />
                    <Title headingLevel="h4" size="lg">
                      No Users Found
                    </Title>
                    <EmptyStateBody>
                      Create and manage Foreman users. Users can be assigned roles and permissions
                      to control their access to different parts of the system.
                    </EmptyStateBody>
                    <Button 
                      variant="primary" 
                      icon={<PlusCircleIcon />}
                      onClick={() => setShowForm(true)}
                    >
                      Add Your First User
                    </Button>
                  </EmptyState>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};