import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Form,
  FormGroup,
  FormHelperText,
  TextInput,
  Button,
  ActionGroup,
  Alert,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
} from '@patternfly/react-core';
import {
  useCurrentUserData,
  useUpdateCurrentUser,
  useChangePassword,
  formatUserFriendlyDate,
  LoadingSpinner,
  UserProfile
} from '@foreman/shared';

export const Profile: React.FC = () => {
  const { data: user, isLoading } = useCurrentUserData();
  const updateUserMutation = useUpdateCurrentUser();
  const changePasswordMutation = useChangePassword();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    mail: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        mail: user.mail || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserMutation.mutateAsync(profileData);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword() || !user) {
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        id: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (err) {
      console.error('Failed to change password:', err);
    }
  };

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (!user) {
    return (
      <PageSection>
        <Card>
          <CardBody>
            <Title headingLevel="h4" size="lg">
              User profile not found
            </Title>
          </CardBody>
        </Card>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          My Profile
        </Title>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem md={6}>
            <Card>
              <CardTitle>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Profile Information
                  {!isEditing && (
                    <Button
                      variant="link"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardBody>
                {!!updateUserMutation.error && (
                  <Alert
                    variant="danger"
                    title="Failed to update profile"
                    isInline
                    style={{ marginBottom: '1rem' }}
                  >
                    {(updateUserMutation.error as Error)?.message || 'An error occurred'}
                  </Alert>
                )}

                {updateUserMutation.isSuccess && !isEditing && (
                  <Alert
                    variant="success"
                    title="Profile updated successfully"
                    isInline
                    style={{ marginBottom: '1rem' }}
                  />
                )}

                {isEditing ? (
                  <Form onSubmit={handleProfileUpdate}>
                    <FormGroup label="First name" fieldId="firstname">
                      <TextInput
                        id="firstname"
                        value={profileData.firstname}
                        onChange={(_event, value) =>
                          setProfileData(prev => ({ ...prev, firstname: value }))
                        }
                      />
                    </FormGroup>

                    <FormGroup label="Last name" fieldId="lastname">
                      <TextInput
                        id="lastname"
                        value={profileData.lastname}
                        onChange={(_event, value) =>
                          setProfileData(prev => ({ ...prev, lastname: value }))
                        }
                      />
                    </FormGroup>

                    <FormGroup label="Email" fieldId="email">
                      <TextInput
                        id="email"
                        type="email"
                        value={profileData.mail}
                        onChange={(_event, value) =>
                          setProfileData(prev => ({ ...prev, mail: value }))
                        }
                      />
                    </FormGroup>

                    <ActionGroup>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={updateUserMutation.isPending}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => {
                          setIsEditing(false);
                          setProfileData({
                            firstname: user.firstname || '',
                            lastname: user.lastname || '',
                            mail: user.mail || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </ActionGroup>
                  </Form>
                ) : (
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Username</DescriptionListTerm>
                      <DescriptionListDescription>{user.login}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>First name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.firstname || 'Not set'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.lastname || 'Not set'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Email</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.mail || 'Not set'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.disabled ? (
                          <Label color="red">Disabled</Label>
                        ) : (
                          <Label color="green">Active</Label>
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Administrator</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.admin ? 'Yes' : 'No'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last login</DescriptionListTerm>
                      <DescriptionListDescription>
                        {user.last_login_on
                          ? formatUserFriendlyDate(user.last_login_on)
                          : 'Never'
                        }
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                )}
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={6}>
            <Card>
              <CardTitle>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Change Password
                  {!isChangingPassword && (
                    <Button
                      variant="link"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardBody>
                {!!changePasswordMutation.error && (
                  <Alert
                    variant="danger"
                    title="Failed to change password"
                    isInline
                    style={{ marginBottom: '1rem' }}
                  >
                    {(changePasswordMutation.error as Error)?.message || 'An error occurred'}
                  </Alert>
                )}

                {changePasswordMutation.isSuccess && !isChangingPassword && (
                  <Alert
                    variant="success"
                    title="Password changed successfully"
                    isInline
                    style={{ marginBottom: '1rem' }}
                  />
                )}

                {isChangingPassword ? (
                  <Form onSubmit={handlePasswordChange}>
                    <FormGroup
                      label="Current password"
                      isRequired
                      fieldId="current-password"
                    >
                      <TextInput
                        isRequired
                        type="password"
                        id="current-password"
                        value={passwordData.currentPassword}
                        onChange={(_event, value) =>
                          setPasswordData(prev => ({ ...prev, currentPassword: value }))
                        }
                        />
                      {passwordErrors.currentPassword && (
                        <FormHelperText>{passwordErrors.currentPassword}</FormHelperText>
                      )}
                    </FormGroup>

                    <FormGroup
                      label="New password"
                      isRequired
                      fieldId="new-password"
                    >
                      <TextInput
                        isRequired
                        type="password"
                        id="new-password"
                        value={passwordData.newPassword}
                        onChange={(_event, value) =>
                          setPasswordData(prev => ({ ...prev, newPassword: value }))
                        }
                        />
                      {passwordErrors.newPassword ? (
                        <FormHelperText>{passwordErrors.newPassword}</FormHelperText>
                      ) : (
                        <FormHelperText>Must be at least 8 characters long</FormHelperText>
                      )}
                    </FormGroup>

                    <FormGroup
                      label="Confirm new password"
                      isRequired
                      fieldId="confirm-password"
                    >
                      <TextInput
                        isRequired
                        type="password"
                        id="confirm-password"
                        value={passwordData.confirmPassword}
                        onChange={(_event, value) =>
                          setPasswordData(prev => ({ ...prev, confirmPassword: value }))
                        }
                        />
                      {passwordErrors.confirmPassword && (
                        <FormHelperText>{passwordErrors.confirmPassword}</FormHelperText>
                      )}
                    </FormGroup>

                    <ActionGroup>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={changePasswordMutation.isPending}
                      >
                        Change Password
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                          setPasswordErrors({});
                        }}
                      >
                        Cancel
                      </Button>
                    </ActionGroup>
                  </Form>
                ) : (
                  <p>Click &quot;Change&quot; to update your password.</p>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>

      <PageSection>
        <UserProfile />
      </PageSection>
    </>
  );
};