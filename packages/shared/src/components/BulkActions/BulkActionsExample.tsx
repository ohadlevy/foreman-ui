import React, { useState } from 'react';
import {
  Page,
  PageSection,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Text,
  TextVariants,
  Label,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { BulkActionsProvider } from './BulkActionsProvider';
import { BulkActionsContainer } from './BulkActionsContainer';

interface Host {
  id: number;
  name: string;
  ip_address: string;
  status: 'active' | 'disabled' | 'building';
  hostgroup: string;
  environment: string;
}

// Mock host data
const mockHosts: Host[] = [
  { id: 1, name: 'web-01.example.com', ip_address: '192.168.1.10', status: 'active', hostgroup: 'Webservers', environment: 'production' },
  { id: 2, name: 'web-02.example.com', ip_address: '192.168.1.11', status: 'active', hostgroup: 'Webservers', environment: 'production' },
  { id: 3, name: 'db-01.example.com', ip_address: '192.168.1.20', status: 'active', hostgroup: 'Database', environment: 'production' },
  { id: 4, name: 'app-01.example.com', ip_address: '192.168.1.30', status: 'building', hostgroup: 'Application', environment: 'staging' },
  { id: 5, name: 'app-02.example.com', ip_address: '192.168.1.31', status: 'disabled', hostgroup: 'Application', environment: 'staging' },
];

/**
 * Example implementation showing how to integrate bulk actions with a host table.
 * This demonstrates the complete workflow from selection to action execution.
 */
export const BulkActionsExample: React.FC = () => {
  const [selectedHostIds, setSelectedHostIds] = useState<number[]>([]);
  const [selectAllPages, setSelectAllPages] = useState(false);

  const handleHostSelection = (hostId: number, isSelected: boolean) => {
    setSelectedHostIds(prev => 
      isSelected 
        ? [...prev, hostId]
        : prev.filter(id => id !== hostId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedHostIds(isSelected ? mockHosts.map(host => host.id) : []);
  };

  const handleSelectAllPages = () => {
    setSelectAllPages(true);
    setSelectedHostIds(mockHosts.map(host => host.id));
  };

  const handleClearSelection = () => {
    setSelectedHostIds([]);
    setSelectAllPages(false);
  };

  const getSelectedItems = () => {
    return mockHosts
      .filter(host => selectedHostIds.includes(host.id))
      .map(host => ({ id: host.id, name: host.name }));
  };

  const shouldShowSelectAllPages = !selectAllPages && 
    selectedHostIds.length > 0 && 
    selectedHostIds.length < mockHosts.length;

  const getStatusBadgeColor = (status: Host['status']) => {
    switch (status) {
      case 'active': return 'green';
      case 'disabled': return 'red'; 
      case 'building': return 'blue';
      default: return 'grey';
    }
  };

  // Helper function to get status icon for accessibility
  const getStatusIcon = (status: Host['status']) => {
    switch (status) {
      case 'active': return '✓';
      case 'disabled': return '✗'; 
      case 'building': return '⚠';
      default: return '?';
    }
  };

  // Helper function to get accessible status label
  const getStatusAriaLabel = (status: Host['status']) => {
    switch (status) {
      case 'active': return 'Host is active and running';
      case 'disabled': return 'Host is disabled'; 
      case 'building': return 'Host is currently building';
      default: return `Host status is ${status}`;
    }
  };

  return (
    <BulkActionsProvider
      enabledActions={[
        'update_hostgroup',
        'update_environment',
        'update_owner',
        'build',
        'enable',
        'disable',
        'destroy'
      ]}
      userPermissions={[
        'edit_hosts',
        'build_hosts',
        'destroy_hosts'
      ]}
    >
      <Page>
        <PageSection>
          <Card>
            <CardTitle>
              <Text component={TextVariants.h2}>
                Host Management with Bulk Actions
              </Text>
              <Text component={TextVariants.p}>
                Select hosts below to perform bulk operations. This example demonstrates 
                the complete bulk actions workflow including selection management, 
                action execution, and progress tracking.
              </Text>
            </CardTitle>
            <CardBody>
              {/* Bulk Actions Toolbar */}
              <BulkActionsContainer
                selectedItems={getSelectedItems()}
                totalCount={mockHosts.length}
                onClearSelection={handleClearSelection}
                onSelectAllPages={handleSelectAllPages}
                showSelectAllPages={shouldShowSelectAllPages}
                className="pf-v5-u-mb-md"
                autoClearTimeoutMs={5000} // Custom 5-second timeout for demo
              />

              {/* Host Table */}
              <Table aria-label="Hosts table">
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox
                        id="select-all-hosts"
                        isChecked={selectedHostIds.length === mockHosts.length}
                        onChange={(_event, checked) => handleSelectAll(checked)}
                        aria-label="Select all hosts"
                      />
                    </Th>
                    <Th>Name</Th>
                    <Th>IP Address</Th>
                    <Th>Status</Th>
                    <Th>Hostgroup</Th>
                    <Th>Environment</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mockHosts.map((host) => (
                    <Tr key={host.id}>
                      <Td>
                        <Checkbox
                          id={`select-host-${host.id}`}
                          isChecked={selectedHostIds.includes(host.id)}
                          onChange={(_event, checked) => handleHostSelection(host.id, checked)}
                          aria-label={`Select ${host.name}`}
                        />
                      </Td>
                      <Td>{host.name}</Td>
                      <Td>{host.ip_address}</Td>
                      <Td>
                        <Label 
                          color={getStatusBadgeColor(host.status)}
                          aria-label={getStatusAriaLabel(host.status)}
                          icon={<span aria-hidden="true">{getStatusIcon(host.status)}</span>}
                        >
                          {host.status}
                        </Label>
                      </Td>
                      <Td>{host.hostgroup}</Td>
                      <Td>{host.environment}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {selectedHostIds.length === 0 && (
                <div className="pf-v5-u-text-align-center pf-v5-u-py-xl">
                  <Text component={TextVariants.p}>
                    Select one or more hosts to see available bulk actions.
                  </Text>
                </div>
              )}
            </CardBody>
          </Card>
        </PageSection>

        <PageSection>
          <Card>
            <CardTitle>Integration Notes</CardTitle>
            <CardBody>
              <Text component={TextVariants.h3}>How to integrate bulk actions:</Text>
              <ol className="pf-v5-u-pl-lg">
                <li className="pf-v5-u-mb-sm">
                  <strong>Wrap your application with BulkActionsProvider:</strong> Configure available actions and user permissions
                </li>
                <li className="pf-v5-u-mb-sm">
                  <strong>Use BulkActionsContainer:</strong> Provides the toolbar, modal, and progress components
                </li>
                <li className="pf-v5-u-mb-sm">
                  <strong>Implement selection state:</strong> Track selected items and provide selection management
                </li>
                <li className="pf-v5-u-mb-sm">
                  <strong>Pass selected items:</strong> Provide the container with selected items in the expected format
                </li>
              </ol>

              <Text component={TextVariants.h3} className="pf-v5-u-mt-lg">
                Available Configuration Options:
              </Text>
              <ul className="pf-v5-u-pl-lg">
                <li><strong>enabledActions:</strong> Array of action IDs to enable</li>
                <li><strong>userPermissions:</strong> Array of user permissions for action filtering</li>
                <li><strong>showSelectAllPages:</strong> Enable &quot;select all&quot; functionality for paginated data</li>
              </ul>
            </CardBody>
          </Card>
        </PageSection>
      </Page>
    </BulkActionsProvider>
  );
};