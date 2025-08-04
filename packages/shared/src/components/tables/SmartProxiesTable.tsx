import React, { useState } from 'react';
import {
  Pagination,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Label,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
  IAction,
  TableVariant,
} from '@patternfly/react-table';
import { SyncIcon, TrashIcon, EditIcon } from '@patternfly/react-icons';
import { SmartProxy, SearchParams } from '../../types';

interface SmartProxiesTableProps {
  smartProxies: SmartProxy[];
  isLoading?: boolean;
  onEdit?: (smartProxy: SmartProxy) => void;
  onDelete?: (smartProxy: SmartProxy) => void;
  onRefresh?: (smartProxy: SmartProxy) => void;
  onSearch?: (params: SearchParams) => void;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onSetPage: (page: number) => void;
    onSetPerPage: (perPage: number) => void;
  };
}

export const SmartProxiesTable: React.FC<SmartProxiesTableProps> = ({
  smartProxies,
  isLoading = false,
  onEdit,
  onDelete,
  onRefresh,
  onSearch,
  pagination,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const columnNames = {
    name: 'Name',
    url: 'URL',
    features: 'Features',
    version: 'Version',
    lastReport: 'Last Report',
    organizations: 'Organizations',
    locations: 'Locations',
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch({ search: value, page: 1 });
    }
  };

  const getRowActions = (smartProxy: SmartProxy): IAction[] => {
    const actions: IAction[] = [];

    if (onRefresh) {
      actions.push({
        title: 'Refresh',
        icon: <SyncIcon />,
        onClick: () => onRefresh(smartProxy),
      });
    }

    if (onEdit) {
      actions.push({
        title: 'Edit',
        icon: <EditIcon />,
        onClick: () => onEdit(smartProxy),
      });
    }

    if (onDelete) {
      actions.push({
        title: 'Delete',
        icon: <TrashIcon />,
        onClick: () => onDelete(smartProxy),
        isDanger: true,
      });
    }

    return actions;
  };

  const formatLastReport = (lastReport?: string) => {
    if (!lastReport) return 'Never';
    
    const date = new Date(lastReport);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const renderFeatures = (features?: Array<{ name: string }>) => {
    if (!features || features.length === 0) {
      return <span>No features</span>;
    }
    
    return (
      <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ flexWrap: 'wrap' }}>
        {features.slice(0, 3).map((feature, index) => (
          <FlexItem key={index}>
            <Label color="blue" variant="filled">
              {feature.name}
            </Label>
          </FlexItem>
        ))}
        {features.length > 3 && (
          <FlexItem>
            <Label color="grey" variant="outline">
              +{features.length - 3} more
            </Label>
          </FlexItem>
        )}
      </Flex>
    );
  };

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Search smart proxies..."
              value={searchValue}
              onChange={(_event, value) => handleSearch(value)}
              onSearch={(_event, value) => handleSearch(value)}
              onClear={() => handleSearch('')}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table variant={TableVariant.compact}>
        <Thead>
          <Tr>
            <Th>{columnNames.name}</Th>
            <Th>{columnNames.url}</Th>
            <Th>{columnNames.features}</Th>
            <Th>{columnNames.version}</Th>
            <Th>{columnNames.lastReport}</Th>
            <Th>{columnNames.organizations}</Th>
            <Th>{columnNames.locations}</Th>
            <Th screenReaderText="Actions" />
          </Tr>
        </Thead>
        <Tbody>
          {smartProxies.map((smartProxy) => (
            <Tr key={smartProxy.id}>
              <Td dataLabel={columnNames.name}>
                <strong>{smartProxy.name}</strong>
              </Td>
              <Td dataLabel={columnNames.url}>
                <a href={smartProxy.url} target="_blank" rel="noopener noreferrer">
                  {smartProxy.url}
                </a>
              </Td>
              <Td dataLabel={columnNames.features}>
                {renderFeatures(smartProxy.features)}
              </Td>
              <Td dataLabel={columnNames.version}>
                {smartProxy.version || 'Unknown'}
              </Td>
              <Td dataLabel={columnNames.lastReport}>
                {formatLastReport(smartProxy.last_report)}
              </Td>
              <Td dataLabel={columnNames.organizations}>
                {smartProxy.organizations && smartProxy.organizations.length > 0 
                  ? smartProxy.organizations.map(org => org.name).join(', ')
                  : 'All organizations'
                }
              </Td>
              <Td dataLabel={columnNames.locations}>
                {smartProxy.locations && smartProxy.locations.length > 0 
                  ? smartProxy.locations.map(loc => loc.name).join(', ')
                  : 'All locations'
                }
              </Td>
              <Td isActionCell>
                <ActionsColumn items={getRowActions(smartProxy)} />
              </Td>
            </Tr>
          ))}
          {smartProxies.length === 0 && !isLoading && (
            <Tr>
              <Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                No smart proxies found.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {pagination && (
        <Pagination
          itemCount={pagination.total}
          widgetId="smart-proxies-pagination"
          perPage={pagination.perPage}
          page={pagination.page}
          onSetPage={(_event, pageNumber) => pagination.onSetPage(pageNumber)}
          onPerPageSelect={(_event, perPage) => pagination.onSetPerPage(perPage)}
          variant="bottom"
        />
      )}
    </>
  );
};