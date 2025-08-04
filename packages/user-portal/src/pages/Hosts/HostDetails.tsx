import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import {
  EllipsisVIcon,
  PlayIcon,
  StopIcon,
  RedoIcon,
  PowerOffIcon,
  EditIcon,
  TrashIcon,
} from '@patternfly/react-icons';
import { 
  useHost, 
  useHostPower, 
  useDeleteHost, 
  formatDateTime, 
  formatRelativeTime, 
  formatUptime,
  LoadingSpinner,
  useActivityStore,
} from '@foreman/shared';

export const HostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isActionDropdownOpen, setIsActionDropdownOpen] = React.useState(false);

  const { data: host, isLoading, error } = useHost(Number(id));
  const powerMutation = useHostPower();
  const deleteMutation = useDeleteHost();
  const { addActivity } = useActivityStore();

  // Track page visit when host data is loaded
  useEffect(() => {
    if (host) {
      addActivity({
        type: 'page_visit',
        title: `Host: ${host.name}`,
        subtitle: 'Host details',
        url: `/hosts/${host.id}`,
        metadata: { hostId: host.id },
      });
    }
  }, [host, addActivity]);

  const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'reset') => {
    if (!host) return;
    try {
      await powerMutation.mutateAsync({ id: host.id, action });
    } catch (err) {
      console.error('Power action failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!host) return;
    if (window.confirm(`Are you sure you want to delete ${host.name}?`)) {
      try {
        await deleteMutation.mutateAsync(host.id);
        navigate('/hosts');
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error || !host) {
    return (
      <PageSection>
        <Card>
          <CardBody>
            <Title headingLevel="h4" size="lg">
              Host not found
            </Title>
          </CardBody>
        </Card>
      </PageSection>
    );
  }

  const getStatusLabel = () => {
    if (host.build) {
      return <Label color="orange">Building</Label>;
    }
    if (host.enabled) {
      return <Label color="green">Running</Label>;
    }
    return <Label color="red">Stopped</Label>;
  };

  const actionDropdownItems = (
    <DropdownList>
      <DropdownItem 
        key="edit"
        icon={<EditIcon />}
        onClick={() => {
          if (host) {
            addActivity({
              type: 'host_edit',
              title: host.name,
              subtitle: 'Host edited',
              url: `/hosts/${host.id}`,
              metadata: { hostId: host.id },
            });
          }
          navigate(`/hosts/${host.id}/edit`);
        }}
      >
        Edit
      </DropdownItem>
      <DropdownItem 
        key="start"
        icon={<PlayIcon />}
        onClick={() => handlePowerAction('start')}
        isDisabled={powerMutation.isPending}
      >
        Start
      </DropdownItem>
      <DropdownItem 
        key="stop"
        icon={<StopIcon />}
        onClick={() => handlePowerAction('stop')}
        isDisabled={powerMutation.isPending}
      >
        Stop
      </DropdownItem>
      <DropdownItem 
        key="restart"
        icon={<RedoIcon />}
        onClick={() => handlePowerAction('restart')}
        isDisabled={powerMutation.isPending}
      >
        Restart
      </DropdownItem>
      <DropdownItem 
        key="reset"
        icon={<PowerOffIcon />}
        onClick={() => handlePowerAction('reset')}
        isDisabled={powerMutation.isPending}
      >
        Reset
      </DropdownItem>
      <DropdownItem 
        key="delete"
        icon={<TrashIcon />}
        onClick={handleDelete}
        isDisabled={deleteMutation.isPending}
      >
        Delete
      </DropdownItem>
    </DropdownList>
  );

  return (
    <>
      <PageSection variant="light">
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              {host.name}
            </Title>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>{getStatusLabel()}</FlexItem>
              <FlexItem>
                <Dropdown
                  isOpen={isActionDropdownOpen}
                  onSelect={() => setIsActionDropdownOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsActionDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                      isExpanded={isActionDropdownOpen}
                      variant="plain"
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                >
                  {actionDropdownItems}
                </Dropdown>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          <GridItem md={6}>
            <Card>
              <CardTitle>Basic Information</CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Name</DescriptionListTerm>
                    <DescriptionListDescription>{host.name}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Domain</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.domain_name || 'Not assigned'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Operating System</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.operatingsystem_name || 'Unknown'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Architecture</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.architecture_name || 'Unknown'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Owner</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.owner_name || 'Not assigned'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={6}>
            <Card>
              <CardTitle>Network Information</CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>IP Address</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.ip || 'Not assigned'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>IPv6 Address</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.ip6 || 'Not assigned'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>MAC Address</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.mac || 'Not assigned'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Subnet</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.subnet_name || 'Not assigned'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={6}>
            <Card>
              <CardTitle>Status Information</CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Build Mode</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.build ? 'Yes' : 'No'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Managed</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.managed ? 'Yes' : 'No'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Enabled</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.enabled ? 'Yes' : 'No'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Uptime</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.uptime_seconds 
                        ? formatUptime(host.uptime_seconds)
                        : 'Unknown'
                      }
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={6}>
            <Card>
              <CardTitle>Timestamps</CardTitle>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>
                      {formatDateTime(host.created_at)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Updated</DescriptionListTerm>
                    <DescriptionListDescription>
                      {formatDateTime(host.updated_at)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Report</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.last_report 
                        ? formatRelativeTime(host.last_report)
                        : 'Never'
                      }
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Compile</DescriptionListTerm>
                    <DescriptionListDescription>
                      {host.last_compile 
                        ? formatRelativeTime(host.last_compile)
                        : 'Never'
                      }
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>

          {host.comment && (
            <GridItem span={12}>
              <Card>
                <CardTitle>Comment</CardTitle>
                <CardBody>
                  {host.comment}
                </CardBody>
              </Card>
            </GridItem>
          )}
        </Grid>
      </PageSection>
    </>
  );
};