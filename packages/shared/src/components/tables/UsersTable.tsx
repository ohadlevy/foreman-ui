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
  Avatar,
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
import { TrashIcon, EditIcon, KeyIcon } from '@patternfly/react-icons';
import { User, SearchParams } from '../../types';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onChangePassword?: (user: User) => void;
  onSearch?: (params: SearchParams) => void;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onSetPage: (page: number) => void;
    onSetPerPage: (perPage: number) => void;
  };
  currentUserId?: number;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading = false,
  onEdit,
  onDelete,
  onChangePassword,
  onSearch,
  pagination,
  currentUserId,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const columnNames = {
    user: 'User',
    email: 'Email',
    roles: 'Roles',
    organizations: 'Organizations',
    lastLogin: 'Last Login',
    status: 'Status',
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch({ search: value, page: 1 });
    }
  };

  const getRowActions = (user: User): IAction[] => {
    const actions: IAction[] = [];

    if (onEdit) {
      actions.push({
        title: 'Edit',
        icon: <EditIcon />,
        onClick: () => onEdit(user),
      });
    }

    if (onChangePassword) {
      actions.push({
        title: 'Change Password',
        icon: <KeyIcon />,
        onClick: () => onChangePassword(user),
      });
    }

    // Don't allow deleting the current user
    if (onDelete && user.id !== currentUserId) {
      actions.push({
        title: 'Delete',
        icon: <TrashIcon />,
        onClick: () => onDelete(user),
        isDanger: true,
      });
    }

    return actions;
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (user: User) => {
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
    return fullName || user.login;
  };

  const renderRoles = (roles?: Array<{ name: string; builtin: boolean }>) => {
    if (!roles || roles.length === 0) {
      return <span>No roles</span>;
    }
    
    return (
      <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ flexWrap: 'wrap' }}>
        {roles.slice(0, 2).map((role, index) => (
          <FlexItem key={index}>
            <Label 
              color={role.builtin ? 'blue' : 'green'} 
              variant={role.builtin ? 'filled' : 'outline'}
            >
              {role.name}
            </Label>
          </FlexItem>
        ))}
        {roles.length > 2 && (
          <FlexItem>
            <Label color="grey" variant="outline">
              +{roles.length - 2} more
            </Label>
          </FlexItem>
        )}
      </Flex>
    );
  };

  const renderUserStatus = (user: User) => {
    if (user.disabled) {
      return <Label color="red" variant="filled">Disabled</Label>;
    }
    if (user.admin) {
      return <Label color="purple" variant="filled">Administrator</Label>;
    }
    return <Label color="green" variant="filled">Active</Label>;
  };

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Search users..."
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
            <Th>{columnNames.user}</Th>
            <Th>{columnNames.email}</Th>
            <Th>{columnNames.roles}</Th>
            <Th>{columnNames.organizations}</Th>
            <Th>{columnNames.lastLogin}</Th>
            <Th>{columnNames.status}</Th>
            <Th screenReaderText="Actions" />
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td dataLabel={columnNames.user}>
                <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>
                    <Avatar 
                      src={`https://www.gravatar.com/avatar/${btoa(user.mail || user.login)}?d=identicon&s=32`}
                      alt={getUserDisplayName(user)}
                      size="sm"
                    />
                  </FlexItem>
                  <FlexItem>
                    <div>
                      <strong>{getUserDisplayName(user)}</strong>
                      {user.id === currentUserId && (
                        <Label color="blue" variant="outline" style={{ marginLeft: '8px' }}>
                          You
                        </Label>
                      )}
                      <div style={{ fontSize: '0.875rem', color: 'var(--pf-v5-global--Color--200)' }}>
                        @{user.login}
                      </div>
                    </div>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={columnNames.email}>
                {user.mail || 'No email'}
              </Td>
              <Td dataLabel={columnNames.roles}>
                {renderRoles(user.roles)}
              </Td>
              <Td dataLabel={columnNames.organizations}>
                {user.organizations && user.organizations.length > 0 
                  ? user.organizations.map(org => org.name).join(', ')
                  : 'All organizations'
                }
              </Td>
              <Td dataLabel={columnNames.lastLogin}>
                {formatLastLogin(user.last_login_on)}
              </Td>
              <Td dataLabel={columnNames.status}>
                {renderUserStatus(user)}
              </Td>
              <Td isActionCell>
                <ActionsColumn items={getRowActions(user)} />
              </Td>
            </Tr>
          ))}
          {users.length === 0 && !isLoading && (
            <Tr>
              <Td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                No users found.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {pagination && (
        <Pagination
          itemCount={pagination.total}
          widgetId="users-pagination"
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