import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Text,
  Button,
  List,
  ListItem,
  Flex,
  FlexItem,
  Label,
  Split,
  SplitItem,
  Alert,
  AlertVariant,
  Spinner,
  Switch,
} from '@patternfly/react-core';
import {
  TimesIcon,
  CheckCircleIcon
} from '@patternfly/react-icons';
import { useAuth } from '../auth/useAuth';
import {
  usePersonalAccessTokens,
  useRevokePersonalAccessToken,
  useCurrentToken
} from '../hooks/usePersonalAccessTokens';
import { formatUserFriendlyDate } from '../utils/formatting';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { tokens, isLoading, error } = usePersonalAccessTokens();
  const { currentToken, isCurrentTokenActive } = useCurrentToken();
  const revokeTokenMutation = useRevokePersonalAccessToken();

  const [showInactiveTokens, setShowInactiveTokens] = useState(false);

  // Filter tokens based on user preference
  const activeTokens = tokens.filter(token => token['active?'] !== false && token.active !== false);
  const filteredTokens = showInactiveTokens ? tokens : activeTokens;

  const handleRevokeToken = async (tokenId: number, isCurrentToken: boolean) => {
    if (isCurrentToken) {
      // If revoking current token, logout the user
      await logout();
    } else {
      await revokeTokenMutation.mutateAsync(tokenId);
    }
  };



  if (!user) {
    return null;
  }

  return (
    <div>
      <Card>
        <CardTitle>User Profile</CardTitle>
        <CardBody>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem>
              <Text component="h3">{user.firstname} {user.lastname}</Text>
              <Text component="small" style={{ color: 'var(--pf-global--Color--200)' }}>
                {user.login} • {user.mail}
              </Text>
              {user.admin && (
                <Label color="red" style={{ marginLeft: '8px' }}>Administrator</Label>
              )}
            </FlexItem>

            <FlexItem>
              <Text component="h4">Organizations</Text>
              {user.organizations.length > 0 ? (
                <List>
                  {user.organizations.map(org => (
                    <ListItem key={org.id}>{org.name}</ListItem>
                  ))}
                </List>
              ) : (
                <Text component="small">No organizations assigned</Text>
              )}
            </FlexItem>

            <FlexItem>
              <Text component="h4">Locations</Text>
              {user.locations.length > 0 ? (
                <List>
                  {user.locations.map(loc => (
                    <ListItem key={loc.id}>{loc.name}</ListItem>
                  ))}
                </List>
              ) : (
                <Text component="small">No locations assigned</Text>
              )}
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>

      <Card style={{ marginTop: '16px' }}>
        <CardTitle>Active Sessions & Tokens</CardTitle>
        <CardBody>
          {isLoading ? (
            <Flex justifyContent={{ default: 'justifyContentCenter' }}>
              <Spinner size="md" />
              <Text style={{ marginLeft: '8px' }}>Loading tokens...</Text>
            </Flex>
          ) : error ? (
            <Alert variant={AlertVariant.danger} title="Error loading tokens">
              Unable to fetch your active tokens. Please try refreshing the page.
            </Alert>
          ) : (
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
              {/* Current Session Info */}
              <FlexItem>
                <Alert
                  variant={isCurrentTokenActive ? AlertVariant.info : AlertVariant.warning}
                  isInline
                  title="Current Session"
                >
                  {currentToken ? (
                    <Text component="small">
                      Created: {formatUserFriendlyDate(currentToken.created_at)}
                      {currentToken.last_used_at && ` • Last used: ${formatUserFriendlyDate(currentToken.last_used_at)}`}
                    </Text>
                  ) : (
                    <Text component="small">Session information not available</Text>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    style={{ marginTop: '8px' }}
                    onClick={() => logout()}
                  >
                    Logout Current Session
                  </Button>
                </Alert>
              </FlexItem>

              {/* All Personal Access Tokens */}
              <FlexItem>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <Text component="h4">
                      Personal Access Tokens ({activeTokens.length} active{tokens.length > activeTokens.length ? `, ${tokens.length - activeTokens.length} inactive` : ''})
                    </Text>
                  </FlexItem>
                  <FlexItem>
                    <Switch
                      id="show-inactive-tokens"
                      label="Show inactive tokens"
                      isChecked={showInactiveTokens}
                      onChange={(_event, checked) => setShowInactiveTokens(checked)}
                      isDisabled={tokens.length === activeTokens.length}
                    />
                  </FlexItem>
                </Flex>
                {filteredTokens.length === 0 ? (
                  <Text component="small">
                    {showInactiveTokens
                      ? "No personal access tokens found."
                      : "No active personal access tokens found. Toggle 'Show inactive tokens' to see all tokens."}
                  </Text>
                ) : (
                  <List>
                    {filteredTokens.map(token => {
                      const isCurrentTokenItem = currentToken?.id === token.id;
                      return (
                        <ListItem key={token.id}>
                          <Split hasGutter>
                            <SplitItem isFilled>
                              <Flex direction={{ default: 'column' }}>
                                <FlexItem>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }}>
                                    <FlexItem>
                                      <strong>{token.name}</strong>
                                      {isCurrentTokenItem && (
                                        <Label color="blue" style={{ marginLeft: '8px' }}>
                                          Current
                                        </Label>
                                      )}
                                    </FlexItem>
                                    <FlexItem>
                                      {(token['active?'] !== false && token.active !== false) ? (
                                        <CheckCircleIcon style={{ color: 'var(--pf-global--success-color--100)' }} />
                                      ) : (
                                        <TimesIcon style={{ color: 'var(--pf-global--danger-color--100)' }} />
                                      )}
                                    </FlexItem>
                                  </Flex>
                                </FlexItem>
                                <FlexItem>
                                  <Text component="small">
                                    Created: {formatUserFriendlyDate(token.created_at)}
                                    {token.last_used_at && ` • Last used: ${formatUserFriendlyDate(token.last_used_at)}`}
                                    {token.expires_at && ` • Expires: ${formatUserFriendlyDate(token.expires_at)}`}
                                  </Text>
                                </FlexItem>
                              </Flex>
                            </SplitItem>
                            <SplitItem>
                              {(token['active?'] !== false && token.active !== false) && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRevokeToken(token.id, isCurrentTokenItem)}
                                  isLoading={revokeTokenMutation.isPending}
                                >
                                  {isCurrentTokenItem ? 'Logout' : 'Revoke'}
                                </Button>
                              )}
                            </SplitItem>
                          </Split>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </FlexItem>

              {/* Security Notice */}
              <FlexItem>
                <Alert variant={AlertVariant.info} isInline title="Security Notice">
                  <Text component="small">
                    Personal Access Tokens provide secure access to the Foreman API.
                    Keep your tokens secure and revoke any tokens you no longer need.
                    If you suspect a token has been compromised, revoke it immediately.
                  </Text>
                </Alert>
              </FlexItem>
            </Flex>
          )}
        </CardBody>
      </Card>
    </div>
  );
};