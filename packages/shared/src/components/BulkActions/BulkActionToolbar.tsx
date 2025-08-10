import React, { useState } from 'react';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Split,
  SplitItem,
  Badge,
} from '@patternfly/react-core';
import {
  TimesIcon,
  EllipsisVIcon,
} from '@patternfly/react-icons';
import { BulkAction } from '../../types';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  onActionClick: (action: BulkAction) => void;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  onActionClick,
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const enabledActions = actions.filter(action => !action.disabled);
  const primaryActions = enabledActions.slice(0, 2);
  const secondaryActions = enabledActions.slice(2);

  return (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <Split hasGutter>
            <SplitItem>
              <Badge isRead>
                {selectedCount} of {totalCount} selected
              </Badge>
            </SplitItem>
            <SplitItem>
              <Button
                variant="link"
                icon={<TimesIcon />}
                onClick={onClearSelection}
                size="sm"
              >
                Clear selection
              </Button>
            </SplitItem>
          </Split>
        </ToolbarItem>

        {primaryActions.length > 0 && (
          <>
            {primaryActions.map((action) => (
              <ToolbarItem key={action.id}>
                <Button
                  variant={action.destructive ? 'danger' : 'secondary'}
                  onClick={() => onActionClick(action)}
                  isDisabled={action.disabled}
                  title={action.disabledReason}
                >
                  {action.label}
                </Button>
              </ToolbarItem>
            ))}
          </>
        )}

        {secondaryActions.length > 0 && (
          <ToolbarItem>
            <Dropdown
              isOpen={isActionsOpen}
              onOpenChange={setIsActionsOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  variant="secondary"
                  icon={<EllipsisVIcon />}
                >
                  More actions
                </MenuToggle>
              )}
            >
              <DropdownList>
                {secondaryActions.map((action) => (
                  <DropdownItem
                    key={action.id}
                    onClick={() => {
                      onActionClick(action);
                      setIsActionsOpen(false);
                    }}
                    isDisabled={action.disabled}
                    isDanger={action.destructive}
                  >
                    {action.label}
                  </DropdownItem>
                ))}
              </DropdownList>
            </Dropdown>
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};