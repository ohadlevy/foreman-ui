import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  Button,
  Alert,
  Switch,
  ClipboardCopy,
  Stack,
  StackItem,
  Grid,
  GridItem,
  Spinner,
} from '@patternfly/react-core';
import {
  useGenerateRegistrationCommand,
  useRegistrationFormData,
  RegistrationParams,
  useAuth
} from '@foreman/shared';

export const Registration: React.FC = () => {
  const { user } = useAuth();
  const generateCommand = useGenerateRegistrationCommand();
  const { data: registrationFormData, isLoading: formDataLoading, error: formDataError } = useRegistrationFormData();
  
  // Extract data from the combined response
  const hostGroups = registrationFormData?.hostGroups || [];
  const smartProxies = registrationFormData?.smartProxies || [];
  const hostGroupsLoading = formDataLoading;
  const smartProxiesLoading = formDataLoading;
  const hostGroupsError = formDataError;
  const smartProxiesError = formDataError;

  const [formData, setFormData] = useState<RegistrationParams>({
    insecure: false,
  });

  const [generatedCommand, setGeneratedCommand] = useState<string>('');

  // Auto-select single org/location when user has only one option
  useEffect(() => {
    if (user) {
      const updates: Partial<RegistrationParams> = {};

      if (user.organizations.length === 1) {
        updates.organization_id = user.organizations[0].id;
      }

      if (user.locations.length === 1) {
        updates.location_id = user.locations[0].id;
      }

      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [user]);

  const showOrgField = user?.organizations && user.organizations.length > 1;
  const showLocationField = user?.locations && user.locations.length > 1;

  const handleInputChange = (field: keyof RegistrationParams, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'hostgroup_id' || field === 'smart_proxy_id' || field === 'organization_id' || field === 'location_id'
        ? Number(value)
        : value
    }));
  };

  const handleGenerateCommand = async () => {
    try {
      const command = await generateCommand.mutateAsync(formData);
      setGeneratedCommand(command.script);
    } catch (error) {
      console.error('Failed to generate registration command:', error);
    }
  };

  const isFormValid = () => {
    // If user has multiple orgs, org must be selected; same for location
    if (showOrgField && !formData.organization_id) {
      return false;
    }
    if (showLocationField && !formData.location_id) {
      return false;
    }
    // Other fields are optional for basic registration
    return true;
  };

  return (
    <>
      <PageSection variant="secondary">
        <Title headingLevel="h1" size="2xl">
          Host Registration
        </Title>
        <p>Generate a command that machines can run to register themselves with Foreman.</p>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Title headingLevel="h2" size="lg">
                  Registration Settings
                </Title>

                <Form>
                  {showOrgField && (
                    <FormGroup
                      label="Organization"
                      isRequired
                      fieldId="organization"
                    >
                      <FormSelect
                        value={formData.organization_id || ''}
                        onChange={(_event, value) => handleInputChange('organization_id', value)}
                        id="organization"
                        name="organization"
                        aria-label="Organization select"
                      >
                        <FormSelectOption value="" label="Select an organization" />
                        {user?.organizations.map((org) => (
                          <FormSelectOption
                            key={org.id}
                            value={org.id}
                            label={org.name}
                          />
                        ))}
                      </FormSelect>
                    </FormGroup>
                  )}

                  {showLocationField && (
                    <FormGroup
                      label="Location"
                      isRequired
                      fieldId="location"
                    >
                      <FormSelect
                        value={formData.location_id || ''}
                        onChange={(_event, value) => handleInputChange('location_id', value)}
                        id="location"
                        name="location"
                        aria-label="Location select"
                      >
                        <FormSelectOption value="" label="Select a location" />
                        {user?.locations.map((loc) => (
                          <FormSelectOption
                            key={loc.id}
                            value={loc.id}
                            label={loc.name}
                          />
                        ))}
                      </FormSelect>
                    </FormGroup>
                  )}

                  <FormGroup
                    label="Host Group"
                    fieldId="hostgroup"
                  >
                    <FormSelect
                      value={formData.hostgroup_id || ''}
                      onChange={(_event, value) => handleInputChange('hostgroup_id', value)}
                      id="hostgroup"
                      name="hostgroup"
                      aria-label="Host group select"
                      isDisabled={hostGroupsLoading}
                    >
                      <FormSelectOption value="" label="Select a host group (optional)" />
                      {hostGroups?.map((hostGroup) => (
                        <FormSelectOption
                          key={hostGroup.id}
                          value={hostGroup.id}
                          label={hostGroup.title || hostGroup.name}
                        />
                      ))}
                    </FormSelect>
                    <FormHelperText>
                      Host group for categorization and settings inheritance
                      {hostGroupsLoading && ' (Loading...)'}
                      {hostGroupsError ? ' (Failed to load host groups)' : ''}
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup
                    label="Smart Proxy"
                    fieldId="smart-proxy"
                  >
                    <FormSelect
                      value={formData.smart_proxy_id || ''}
                      onChange={(_event, value) => handleInputChange('smart_proxy_id', value)}
                      id="smart-proxy"
                      name="smart-proxy"
                      aria-label="Smart proxy select"
                      isDisabled={smartProxiesLoading}
                    >
                      <FormSelectOption value="" label="Select a smart proxy (optional)" />
                      {smartProxies?.map((smartProxy) => (
                        <FormSelectOption
                          key={smartProxy.id}
                          value={smartProxy.id}
                          label={smartProxy.name}
                        />
                      ))}
                    </FormSelect>
                    <FormHelperText>
                      Smart proxy for host management and communication
                      {smartProxiesLoading && ' (Loading...)'}
                      {smartProxiesError ? ' (Failed to load smart proxies)' : ''}
                    </FormHelperText>
                  </FormGroup>

                  <FormGroup
                    label="Security Options"
                    fieldId="security-options"
                  >
                    <Switch
                      id="insecure-registration"
                      label={formData.insecure ? "Allow insecure registration" : "Secure registration (requires certificates)"}
                      isChecked={formData.insecure || false}
                      onChange={(_event, checked) => handleInputChange('insecure', checked)}
                    />
                    <FormHelperText>
                      Allow registration without pre-existing certificates (useful for bootstrapping)
                    </FormHelperText>
                  </FormGroup>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleGenerateCommand}
                    isLoading={generateCommand.isPending}
                    isDisabled={!isFormValid() || generateCommand.isPending}
                  >
                    {generateCommand.isPending ? 'Generating...' : 'Generate Registration Command'}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={6}>
            <Card>
              <CardBody>
                <Title headingLevel="h2" size="lg">
                  Registration Command
                </Title>

                {generateCommand.error ? (
                  <Alert
                    variant="danger"
                    title="Failed to generate command"
                    isInline
                    className="pf-v6-u-mb-md"
                  >
                    {(generateCommand.error as Error)?.message || 'Unable to generate registration command'}
                  </Alert>
                ) : null}

                {generateCommand.isPending && (
                  <div className="pf-v6-u-text-align-center pf-v6-u-p-lg">
                    <Spinner size="lg" />
                    <p>Generating registration token...</p>
                  </div>
                )}

                {generatedCommand && (
                  <Stack hasGutter>
                    <StackItem>
                      <p>Run this command on the target machine to register it with Foreman:</p>
                    </StackItem>

                    <StackItem>
                      <ClipboardCopy
                        isReadOnly
                        hoverTip="Copy"
                        clickTip="Copied"
                        variant="expansion"
                      >
                        {generatedCommand}
                      </ClipboardCopy>
                    </StackItem>

                    <StackItem>
                      <Alert
                        variant="info"
                        title="Security Note"
                        isInline
                      >
                        This command contains a time-limited token. Copy and use it promptly.
                      </Alert>
                    </StackItem>
                  </Stack>
                )}

                {!generatedCommand && !generateCommand.isPending && (
                  <p className="pf-v6-u-color-200">
                    Configure the registration settings and click &quot;Generate Registration Command&quot; to get started.
                  </p>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};
