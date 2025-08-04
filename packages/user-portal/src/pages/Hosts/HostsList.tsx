import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  SearchInput,
  Pagination,
  Card,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Divider,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import {
  PlusIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TimesCircleIcon,
  HistoryIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  useMyHosts,
  formatDateTime,
  formatRelativeTime,
  LoadingSpinner,
  usePermissions,
  RecentHosts,
  RecentSearches,
  useActivityStore,
} from '@foreman/shared';
import { Host } from '@foreman/shared';

export const HostsList: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateHosts } = usePermissions();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);
  const { addActivity } = useActivityStore();

  const { data, isLoading, error } = useMyHosts({
    search,
    page,
    per_page: perPage,
  });

  // Track page visit
  useEffect(() => {
    addActivity({
      type: 'page_visit',
      title: 'My Hosts',
      subtitle: 'Host management',
      url: '/hosts',
    });
  }, [addActivity]);

  // Track search activities
  useEffect(() => {
    if (search && !isLoading && data) {
      // No need to sanitize search input for XSS here, as it is not rendered as HTML
      if (search.trim()) {
        addActivity({
          type: 'search',
          title: search.trim(),
          subtitle: `${data.total} results`,
          url: `/hosts?search=${encodeURIComponent(search.trim())}`,
          metadata: { query: search.trim(), resultCount: data.total },
        });
      }
    }
  }, [search, isLoading, data, addActivity]);

  const getStatusIcon = (host: Host) => {
    if (host.build) {
      return <ExclamationTriangleIcon color="orange" />;
    }
    if (host.enabled) {
      return <CheckCircleIcon color="green" />;
    }
    return <TimesCircleIcon color="red" />;
  };

  const getStatusText = (host: Host) => {
    if (host.build) return 'Building';
    if (host.enabled) return 'Running';
    return 'Stopped';
  };

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Card>
          <EmptyState>
            <EmptyStateIcon icon={ExclamationTriangleIcon} />
            <Title headingLevel="h4" size="lg">
              Error loading hosts
            </Title>
            <EmptyStateBody>
              {(error as Error)?.message || 'Failed to load hosts'}
            </EmptyStateBody>
          </EmptyState>
        </Card>
      </PageSection>
    );
  }

  const hosts = data?.results || [];
  const total = data?.total || 0;

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          My Hosts
        </Title>
      </PageSection>

      <PageSection>
        <Card>
          <Toolbar id="hosts-toolbar">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  placeholder="Search hosts..."
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>

              <ToolbarItem>
                <Dropdown
                  isOpen={recentDropdownOpen}
                  onOpenChange={setRecentDropdownOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setRecentDropdownOpen(!recentDropdownOpen)}
                      variant="secondary"
                      icon={<HistoryIcon />}
                    >
                      Recent
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem isDisabled>
                      <strong>Recent Hosts</strong>
                    </DropdownItem>
                    <RecentHosts onItemSelect={() => setRecentDropdownOpen(false)} />
                    <Divider />
                    <DropdownItem isDisabled>
                      <strong>Recent Searches</strong>
                    </DropdownItem>
                    <RecentSearches onItemSelect={() => setRecentDropdownOpen(false)} />
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>

              {canCreateHosts() && (
                <ToolbarItem align={{ default: 'alignRight' }}>
                  <Button
                    variant="primary"
                    icon={<PlusIcon />}
                    onClick={() => navigate('/hosts/new')}
                  >
                    Create Host
                  </Button>
                </ToolbarItem>
              )}
            </ToolbarContent>
          </Toolbar>

          {hosts.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon icon={ServerIcon} />
              <Title headingLevel="h4" size="lg">
                No hosts found
              </Title>
              <EmptyStateBody>
                {search
                  ? 'No hosts match your search criteria.'
                  : 'You don\'t have any hosts yet. Create your first host to get started.'
                }
              </EmptyStateBody>
              {!search && canCreateHosts() && (
                <Button variant="primary" onClick={() => navigate('/hosts/new')}>
                  Create Host
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Status</Th>
                    <Th>Operating System</Th>
                    <Th>IP Address</Th>
                    <Th>Last Report</Th>
                    <Th>Created</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {hosts.map((host) => (
                    <Tr
                      key={host.id}
                      isRowSelected={false}
                      isClickable
                      onClick={() => {
                        addActivity({
                          type: 'host_view',
                          title: host.name,
                          subtitle: 'Host details',
                          url: `/hosts/${host.id}`,
                          metadata: { hostId: host.id },
                        });
                        navigate(`/hosts/${host.id}`);
                      }}
                    >
                      <Td>
                        <div className="pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-gap-sm">
                          <ServerIcon />
                          {host.name}
                        </div>
                      </Td>
                      <Td>
                        <div className="pf-v5-u-display-flex pf-v5-u-align-items-center pf-v5-u-gap-sm">
                          {getStatusIcon(host)}
                          {getStatusText(host)}
                        </div>
                      </Td>
                      <Td>{host.operatingsystem_name || 'Unknown'}</Td>
                      <Td>{host.ip || 'Not assigned'}</Td>
                      <Td>
                        {host.last_report
                          ? formatRelativeTime(host.last_report)
                          : 'Never'
                        }
                      </Td>
                      <Td>{formatDateTime(host.created_at)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {total > perPage && (
                <Toolbar>
                  <ToolbarContent>
                    <ToolbarItem align={{ default: 'alignRight' }}>
                      <Pagination
                        itemCount={total}
                        perPage={perPage}
                        page={page}
                        onSetPage={(_event, pageNumber) => setPage(pageNumber)}
                        onPerPageSelect={(_event, newPerPage) => {
                          setPerPage(newPerPage);
                          setPage(1);
                        }}
                        widgetId="hosts-pagination"
                      />
                    </ToolbarItem>
                  </ToolbarContent>
                </Toolbar>
              )}
            </>
          )}
        </Card>
      </PageSection>
    </>
  );
};