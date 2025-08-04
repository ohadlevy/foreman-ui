import React from 'react';
import {
  Switch,
  Flex,
  FlexItem,
  Label,
  Tooltip,
} from '@patternfly/react-core';
import { UserIcon, CogIcon } from '@patternfly/react-icons';
import { useMode } from '../../contexts/ModeContext';
import { useCurrentUser } from '../../hooks/useUsers';

export const ModeSwitcher: React.FC = () => {
  const { switchMode, isAdminMode } = useMode();
  const { data: currentUser } = useCurrentUser();

  // Only show mode switcher to admin users
  if (!currentUser?.admin) {
    return null;
  }

  const handleModeSwitch = () => {
    switchMode(isAdminMode ? 'user' : 'admin');
  };

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      <FlexItem>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
          <UserIcon />
          <span style={{ fontSize: '14px' }}>User</span>
        </Flex>
      </FlexItem>
      
      <FlexItem>
        <Tooltip 
          content={isAdminMode ? 'Switch to User Portal' : 'Switch to Admin Portal'}
        >
          <Switch
            id="mode-switcher"
            label=""
            labelOff=""
            isChecked={isAdminMode}
            onChange={handleModeSwitch}
            aria-label="Toggle between User and Admin mode"
          />
        </Tooltip>
      </FlexItem>
      
      <FlexItem>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
          <CogIcon />
          <span style={{ fontSize: '14px' }}>Admin</span>
        </Flex>
      </FlexItem>
      
      <FlexItem>
        <Label 
          color={isAdminMode ? 'red' : 'blue'} 
          variant="filled"
        >
          {isAdminMode ? 'Admin Mode' : 'User Mode'}
        </Label>
      </FlexItem>
    </Flex>
  );
};